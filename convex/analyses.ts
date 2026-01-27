import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { computeProfileHash } from "./lib/profileHash";
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
 * Get a cached analysis for a book + profile hash combination.
 */
export const getByBookAndProfile = query({
  args: {
    bookId: v.id("books"),
    profileHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_book_and_profile", (q) =>
        q.eq("bookId", args.bookId).eq("profileHash", args.profileHash)
      )
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
    profileHash: v.string(),
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
 * Analyze a book against a user's values profile.
 *
 * Flow:
 * 1. Look up the book and profile from the DB
 * 2. Compute profile hash
 * 3. Check for cached analysis
 * 4. If no cache, call OpenAI GPT-4o with structured output
 * 5. Store and return the result
 *
 * Returns "no_verdict" when the book lacks sufficient data for analysis.
 */
export const analyze = action({
  args: {
    bookId: v.id("books"),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch book and profile
    const book = await ctx.runQuery(internal.analyses.getBookById, {
      bookId: args.bookId,
    });
    if (!book) {
      throw new Error("Book not found");
    }

    const profile = await ctx.runQuery(internal.analyses.getProfileById, {
      profileId: args.profileId,
    });
    if (!profile) {
      throw new Error("Profile not found");
    }

    // 2. Compute profile hash
    const profileHash = computeProfileHash({
      violence: profile.violence,
      language: profile.language,
      sexualContent: profile.sexualContent,
      substanceUse: profile.substanceUse,
      darkThemes: profile.darkThemes,
      religiousSensitivity: profile.religiousSensitivity,
    });

    // 3. Check cache
    const cached = await ctx.runQuery(internal.analyses.getCachedAnalysis, {
      bookId: args.bookId,
      profileHash,
    });
    if (cached) {
      return cached;
    }

    // 4. Check if book has enough data for analysis
    if (!book.description && !book.categories?.length) {
      const noVerdictResult = {
        bookId: args.bookId,
        profileHash,
        verdict: "no_verdict" as const,
        summary:
          "Insufficient book data available for content analysis. Try searching for this book again or check back later.",
        contentFlags: [],
      };

      await ctx.runMutation(internal.analyses.store, noVerdictResult);
      return noVerdictResult;
    }

    // 5. Call OpenAI GPT-4o
    const openai = new OpenAI();

    const sensitivityLabels = buildSensitivityLabels(profile);
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
          content: `## Book Information\n${bookContext}\n\n## Reader's Sensitivity Profile\n${sensitivityLabels}\n\nAnalyze this book and return your verdict as JSON.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("OpenAI returned an empty response");
    }

    const parsed = JSON.parse(raw) as OpenAIVerdictResponse;

    // Validate verdict value
    const validVerdicts = ["safe", "caution", "warning", "no_verdict"] as const;
    const verdict = validVerdicts.includes(
      parsed.verdict as (typeof validVerdicts)[number]
    )
      ? (parsed.verdict as (typeof validVerdicts)[number])
      : ("no_verdict" as const);

    // Validate severity values in content flags
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

    const result = {
      bookId: args.bookId,
      profileHash,
      verdict,
      ageRecommendation: parsed.ageRecommendation
        ? String(parsed.ageRecommendation)
        : undefined,
      summary: String(parsed.summary ?? "No summary provided."),
      contentFlags,
      reasoning: parsed.reasoning ? String(parsed.reasoning) : undefined,
    };

    // 6. Store in cache
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
 * Internal query to fetch a profile by ID (used by the analyze action).
 */
export const getProfileById = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

/**
 * Internal cache lookup (used by the analyze action).
 */
export const getCachedAnalysis = internalQuery({
  args: {
    bookId: v.id("books"),
    profileHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_book_and_profile", (q) =>
        q.eq("bookId", args.bookId).eq("profileHash", args.profileHash)
      )
      .unique();
  },
});

// --- Helpers ---

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

function sensitivityLevel(value: number): string {
  if (value <= 2) return "very low tolerance";
  if (value <= 4) return "low tolerance";
  if (value <= 6) return "moderate tolerance";
  if (value <= 8) return "high tolerance";
  return "very high tolerance";
}

function buildSensitivityLabels(profile: {
  violence: number;
  language: number;
  sexualContent: number;
  substanceUse: number;
  darkThemes: number;
  religiousSensitivity: number;
}): string {
  return [
    `- Violence: ${profile.violence}/10 (${sensitivityLevel(profile.violence)})`,
    `- Language: ${profile.language}/10 (${sensitivityLevel(profile.language)})`,
    `- Sexual Content: ${profile.sexualContent}/10 (${sensitivityLevel(profile.sexualContent)})`,
    `- Substance Use: ${profile.substanceUse}/10 (${sensitivityLevel(profile.substanceUse)})`,
    `- Dark Themes: ${profile.darkThemes}/10 (${sensitivityLevel(profile.darkThemes)})`,
    `- Religious Sensitivity: ${profile.religiousSensitivity}/10 (${sensitivityLevel(profile.religiousSensitivity)})`,
  ].join("\n");
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

const SYSTEM_PROMPT = `You are SafeReads, an AI book content analyst for parents. Your job is to analyze books and provide content safety verdicts based on a reader's sensitivity profile.

You will receive book metadata (title, author, description, categories) and a reader's sensitivity profile with tolerance levels for various content categories.

Respond with a JSON object containing:

{
  "verdict": "safe" | "caution" | "warning" | "no_verdict",
  "ageRecommendation": "string (e.g., '12+', '16+', 'All ages')",
  "summary": "A 2-3 sentence plain-language summary of the content suitability for this reader's profile.",
  "contentFlags": [
    {
      "category": "string (e.g., 'Violence', 'Language', 'Sexual Content', 'Substance Use', 'Dark Themes', 'Religious Content')",
      "severity": "none" | "mild" | "moderate" | "heavy",
      "details": "Brief description of specific content in this category"
    }
  ],
  "reasoning": "Your detailed reasoning for the verdict, considering the reader's specific tolerance levels."
}

Guidelines:
- "safe" = content falls well within the reader's tolerance levels across all categories
- "caution" = content approaches or slightly exceeds tolerance in one or more areas
- "warning" = content significantly exceeds the reader's tolerance in one or more areas
- "no_verdict" = insufficient information to make a determination
- Always provide content flags for ALL 6 categories, even if severity is "none"
- Be specific about content when possible (e.g., "battlefield violence" vs just "violence")
- Consider the reader's individual tolerance levels — a book might be "safe" for one profile and "warning" for another
- Base your analysis on widely known information about the book, its reviews, and its content
- If you're unsure about specific content, err on the side of caution and note your uncertainty in the reasoning`;
