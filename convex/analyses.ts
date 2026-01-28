import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

const verdictValues = v.union(
  v.literal("safe"),
  v.literal("caution"),
  v.literal("warning"),
  v.literal("no_verdict")
);

const severityValues = v.union(
  v.literal("none"),
  v.literal("mild"),
  v.literal("moderate"),
  v.literal("heavy")
);

/**
 * List recent analyses with their associated book data.
 * Returns the most recent analyses (newest first), limited by `count`.
 */
export const listRecent = query({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.count ?? 10;
    const analyses = await ctx.db
      .query("analyses")
      .order("desc")
      .take(limit);

    const results = await Promise.all(
      analyses.map(async (analysis) => {
        const book = await ctx.db.get(analysis.bookId);
        return { ...analysis, book };
      })
    );

    return results.filter((r) => r.book !== null);
  },
});

/**
 * Get a cached analysis for a book.
 * One analysis per book (objective, profile-independent).
 */
export const getByBook = query({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .unique();
  },
});

/**
 * Internal mutation to store an analysis result.
 * Called by the analyze action after OpenAI returns a verdict.
 */
export const store = internalMutation({
  args: {
    bookId: v.id("books"),
    verdict: verdictValues,
    ageRecommendation: v.optional(v.string()),
    summary: v.string(),
    contentFlags: v.array(
      v.object({
        category: v.string(),
        severity: severityValues,
        details: v.string(),
      })
    ),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", args);
  },
});

/**
 * Analyze a book's content objectively.
 *
 * Flow:
 * 1. Look up the book from the DB
 * 2. Check for cached analysis
 * 3. If no cache, call OpenAI GPT-4o with structured output
 * 4. Store and return the result
 *
 * Returns "no_verdict" when the book lacks sufficient data for analysis.
 */
export const analyze = action({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch book
    const book = await ctx.runQuery(internal.analyses.getBookById, {
      bookId: args.bookId,
    });
    if (!book) {
      throw new Error("Book not found");
    }

    // 2. Check cache
    const cached = await ctx.runQuery(internal.analyses.getCachedAnalysis, {
      bookId: args.bookId,
    });
    if (cached) {
      return cached;
    }

    // 3. Run analysis (checks data sufficiency, calls OpenAI, returns result)
    const result = await runOpenAIAnalysis(book, args.bookId);

    // 4. Store in cache
    await ctx.runMutation(internal.analyses.store, result);

    return result;
  },
});

/**
 * Internal query to fetch a book by ID (used by the analyze action).
 */
export const getBookById = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookId);
  },
});

/**
 * Re-analyze a book, bypassing the cache.
 *
 * Deletes the existing cached analysis (if any), then runs a fresh OpenAI call.
 */
export const reanalyze = action({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    // 1. Delete existing cached analysis
    await ctx.runMutation(internal.analyses.deleteByBook, {
      bookId: args.bookId,
    });

    // 2. Fetch book
    const book = await ctx.runQuery(internal.analyses.getBookById, {
      bookId: args.bookId,
    });
    if (!book) {
      throw new Error("Book not found");
    }

    // 3. Run fresh analysis
    const result = await runOpenAIAnalysis(book, args.bookId);

    // 4. Store new result
    await ctx.runMutation(internal.analyses.store, result);

    return result;
  },
});

/**
 * Internal cache lookup (used by the analyze action).
 */
export const getCachedAnalysis = internalQuery({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .unique();
  },
});

/**
 * Internal mutation to delete a cached analysis for a book.
 * Used by the reanalyze action to clear the cache before a fresh analysis.
 */
export const deleteByBook = internalMutation({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analyses")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// --- Helpers ---

type BookData = {
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
};

type AnalysisResult = {
  bookId: Id<"books">;
  verdict: "safe" | "caution" | "warning" | "no_verdict";
  ageRecommendation?: string;
  summary: string;
  contentFlags: Array<{
    category: string;
    severity: "none" | "mild" | "moderate" | "heavy";
    details: string;
  }>;
  reasoning?: string;
};

/**
 * Runs an OpenAI GPT-4o analysis on a book.
 * Returns "no_verdict" if the book lacks sufficient data.
 */
async function runOpenAIAnalysis(
  book: BookData,
  bookId: Id<"books">
): Promise<AnalysisResult> {
  if (!book.description && !book.categories?.length) {
    return {
      bookId,
      verdict: "no_verdict",
      summary:
        "Insufficient book data available for content analysis. Try searching for this book again or check back later.",
      contentFlags: [],
    };
  }

  const openai = new OpenAI();
  const bookContext = buildBookContext(book);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `## Book Information\n${bookContext}\n\nAnalyze this book and return your content review as JSON.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = JSON.parse(raw) as OpenAIVerdictResponse;

  const validVerdicts = ["safe", "caution", "warning", "no_verdict"] as const;
  const verdict = validVerdicts.includes(
    parsed.verdict as (typeof validVerdicts)[number]
  )
    ? (parsed.verdict as (typeof validVerdicts)[number])
    : ("no_verdict" as const);

  const validSeverities = ["none", "mild", "moderate", "heavy"] as const;
  const contentFlags = (parsed.contentFlags ?? []).map((flag) => ({
    category: String(flag.category),
    severity: validSeverities.includes(
      flag.severity as (typeof validSeverities)[number]
    )
      ? (flag.severity as (typeof validSeverities)[number])
      : ("none" as const),
    details: String(flag.details),
  }));

  return {
    bookId,
    verdict,
    ageRecommendation: parsed.ageRecommendation
      ? String(parsed.ageRecommendation)
      : undefined,
    summary: String(parsed.summary ?? "No summary provided."),
    contentFlags,
    reasoning: parsed.reasoning ? String(parsed.reasoning) : undefined,
  };
}

interface OpenAIVerdictResponse {
  verdict: string;
  ageRecommendation?: string;
  summary: string;
  contentFlags?: Array<{
    category: string;
    severity: string;
    details: string;
  }>;
  reasoning?: string;
}

function buildBookContext(book: {
  title: string;
  authors: string[];
  description?: string;
  categories?: string[];
  pageCount?: number;
  publishedDate?: string;
}): string {
  const lines = [
    `Title: ${book.title}`,
    `Author(s): ${book.authors.join(", ")}`,
  ];
  if (book.publishedDate) lines.push(`Published: ${book.publishedDate}`);
  if (book.pageCount) lines.push(`Page count: ${book.pageCount}`);
  if (book.categories?.length)
    lines.push(`Categories: ${book.categories.join(", ")}`);
  if (book.description) lines.push(`\nDescription:\n${book.description}`);
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are SafeReads, an AI book content analyst. Your job is to provide objective, factual content reviews of books so parents can make informed decisions for their families.

You will receive book metadata (title, author, description, categories). Provide a neutral, objective assessment of the content — do NOT personalize for any specific reader or sensitivity level.

Respond with a JSON object containing:

{
  "verdict": "safe" | "caution" | "warning" | "no_verdict",
  "ageRecommendation": "string (e.g., '12+', '16+', 'All ages')",
  "summary": "A 2-3 sentence plain-language summary of the book's content, highlighting what parents should know.",
  "contentFlags": [
    {
      "category": "string (e.g., 'Violence', 'Language', 'Sexual Content', 'Substance Use', 'Dark Themes', 'Religious Content')",
      "severity": "none" | "mild" | "moderate" | "heavy",
      "details": "Brief, objective description of specific content in this category"
    }
  ],
  "reasoning": "Your detailed reasoning for the verdict and age recommendation."
}

Guidelines:
- "safe" = content is generally appropriate for most young readers (roughly ages 8+), with no significant mature themes
- "caution" = content contains some mature elements that parents may want to be aware of (roughly ages 12+)
- "warning" = content contains significant mature themes and is best suited for older teens or adults (roughly ages 16+)
- "no_verdict" = insufficient information to make a determination
- Always provide content flags for ALL 6 categories (Violence, Language, Sexual Content, Substance Use, Dark Themes, Religious Content), even if severity is "none"
- Be specific and factual about content (e.g., "battlefield violence with graphic injuries" vs just "violence")
- Be objective — describe what the content IS, not whether it's good or bad
- Base your analysis on widely known information about the book, its reviews, and its content
- If you're unsure about specific content, note your uncertainty in the reasoning and err on the side of caution
- The age recommendation should reflect general community standards, not any individual family's values`;
