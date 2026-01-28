import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

type BookResult = {
  _id: Id<"books">;
  googleBooksId?: string;
  openLibraryKey?: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  pageCount?: number;
  publishedDate?: string;
  categories?: string[];
  isbn10?: string;
  isbn13?: string;
  maturityRating?: string;
  averageRating?: number;
  ratingsCount?: number;
};

// --- Public queries ---

export const getById = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookId);
  },
});

// --- Internal mutations ---

/**
 * Upsert a book by googleBooksId.
 * If a book with the same googleBooksId exists, update it.
 * Otherwise insert a new record.
 * Returns the Convex document ID.
 */
export const upsert = internalMutation({
  args: {
    googleBooksId: v.optional(v.string()),
    openLibraryKey: v.optional(v.string()),
    title: v.string(),
    authors: v.array(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    publishedDate: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    isbn10: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    maturityRating: v.optional(v.string()),
    averageRating: v.optional(v.number()),
    ratingsCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.googleBooksId) {
      const existing = await ctx.db
        .query("books")
        .withIndex("by_google_books_id", (q) =>
          q.eq("googleBooksId", args.googleBooksId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          openLibraryKey: args.openLibraryKey ?? existing.openLibraryKey,
          description: args.description ?? existing.description,
          coverUrl: args.coverUrl ?? existing.coverUrl,
          pageCount: args.pageCount ?? existing.pageCount,
          categories: args.categories ?? existing.categories,
          isbn10: args.isbn10 ?? existing.isbn10,
          isbn13: args.isbn13 ?? existing.isbn13,
          maturityRating: args.maturityRating ?? existing.maturityRating,
          averageRating: args.averageRating ?? existing.averageRating,
          ratingsCount: args.ratingsCount ?? existing.ratingsCount,
        });
        return existing._id;
      }
    }

    return await ctx.db.insert("books", args);
  },
});

// --- Public actions ---

/**
 * Search for books via Google Books API.
 * For each result, attempts Open Library enrichment if description or categories are missing.
 * Upserts all results into the books table for caching.
 * Returns an array of book documents with their Convex IDs.
 */
export const search = action({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BookResult[]> => {
    const maxResults = args.maxResults ?? 10;
    const googleResults = await searchGoogleBooks(args.query, maxResults);

    const books: BookResult[] = await Promise.all(
      googleResults.map(async (item) => {
        const parsed = parseGoogleBooksItem(item);

        // Attempt Open Library enrichment if missing description or categories
        if (!parsed.description || !parsed.categories?.length) {
          const enrichment = await fetchOpenLibraryData(
            parsed.isbn13 ?? parsed.isbn10,
            parsed.title,
            parsed.authors[0]
          );
          if (enrichment) {
            parsed.description = parsed.description || enrichment.description;
            parsed.categories =
              parsed.categories?.length
                ? parsed.categories
                : enrichment.subjects;
            parsed.openLibraryKey = enrichment.key;
            parsed.coverUrl = parsed.coverUrl || enrichment.coverUrl;
          }
        }

        const bookId = await ctx.runMutation(internal.books.upsert, parsed);

        return {
          _id: bookId,
          ...parsed,
        };
      })
    );

    return books;
  },
});

// --- Google Books API ---

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksItem[];
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    maturityRating?: string;
    averageRating?: number;
    ratingsCount?: number;
  };
}

async function searchGoogleBooks(
  query: string,
  maxResults: number
): Promise<GoogleBooksItem[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    printType: "books",
    orderBy: "relevance",
  });

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    params.set("key", apiKey);
  }

  const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;

  // Retry with exponential backoff on rate limiting
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url);

    if (response.status === 429) {
      const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `Google Books API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as GoogleBooksResponse;
    return data.items ?? [];
  }

  throw new Error("Google Books API rate limited after 3 retries. Try again in a moment.");
}

interface ParsedBook {
  googleBooksId: string;
  openLibraryKey?: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  pageCount?: number;
  publishedDate?: string;
  categories?: string[];
  isbn10?: string;
  isbn13?: string;
  maturityRating?: string;
  averageRating?: number;
  ratingsCount?: number;
}

function parseGoogleBooksItem(item: GoogleBooksItem): ParsedBook {
  const info = item.volumeInfo;
  const identifiers = info.industryIdentifiers ?? [];

  const isbn13 = identifiers.find((id) => id.type === "ISBN_13")?.identifier;
  const isbn10 = identifiers.find((id) => id.type === "ISBN_10")?.identifier;

  // Prefer HTTPS thumbnail, strip edge/zoom params for higher quality
  let coverUrl = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  if (coverUrl) {
    coverUrl = coverUrl.replace("http://", "https://");
  }

  return {
    googleBooksId: item.id,
    title: info.title,
    authors: info.authors ?? ["Unknown Author"],
    description: info.description,
    coverUrl,
    pageCount: info.pageCount,
    publishedDate: info.publishedDate,
    categories: info.categories,
    isbn10,
    isbn13,
    maturityRating: info.maturityRating,
    averageRating: info.averageRating,
    ratingsCount: info.ratingsCount,
  };
}

// --- Open Library API ---

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  cover_i?: number;
  subject?: string[];
  first_sentence?: string[];
}

interface OpenLibrarySearchResponse {
  docs: OpenLibrarySearchDoc[];
}

interface OpenLibraryWorkResponse {
  description?:
    | string
    | { type: string; value: string };
  subjects?: string[];
  covers?: number[];
}

async function fetchOpenLibraryData(
  isbn: string | undefined,
  title: string,
  author: string | undefined
): Promise<{
  description?: string;
  subjects?: string[];
  key?: string;
  coverUrl?: string;
} | null> {
  try {
    let workKey: string | undefined;
    let subjects: string[] | undefined;
    let coverUrl: string | undefined;

    // Strategy 1: Look up by ISBN if available
    if (isbn) {
      const isbnResponse = await fetch(
        `https://openlibrary.org/isbn/${isbn}.json`
      );
      if (isbnResponse.ok) {
        const isbnData = (await isbnResponse.json()) as {
          works?: Array<{ key: string }>;
          covers?: number[];
        };
        workKey = isbnData.works?.[0]?.key;
        if (isbnData.covers?.[0]) {
          coverUrl = `https://covers.openlibrary.org/b/id/${isbnData.covers[0]}-M.jpg`;
        }
      }
    }

    // Strategy 2: Search by title + author
    if (!workKey) {
      const searchQuery = author ? `${title} ${author}` : title;
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "1",
        fields: "key,title,cover_i,subject",
      });
      const searchResponse = await fetch(
        `https://openlibrary.org/search.json?${params.toString()}`
      );
      if (searchResponse.ok) {
        const searchData =
          (await searchResponse.json()) as OpenLibrarySearchResponse;
        const doc = searchData.docs[0];
        if (doc) {
          workKey = doc.key;
          subjects = doc.subject?.slice(0, 5);
          if (doc.cover_i) {
            coverUrl =
              coverUrl ??
              `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
          }
        }
      }
    }

    // Fetch work details for description
    if (workKey) {
      const workResponse = await fetch(
        `https://openlibrary.org${workKey}.json`
      );
      if (workResponse.ok) {
        const workData = (await workResponse.json()) as OpenLibraryWorkResponse;
        const description =
          typeof workData.description === "string"
            ? workData.description
            : workData.description?.value;

        subjects = subjects ?? workData.subjects?.slice(0, 5);

        return {
          description,
          subjects,
          key: workKey,
          coverUrl,
        };
      }
    }

    // Return partial data if we found anything
    if (subjects?.length || coverUrl) {
      return { subjects, coverUrl, key: workKey };
    }

    return null;
  } catch {
    // Open Library is a fallback — don't fail the search if it's down
    return null;
  }
}

// --- Vision AI book identification ---

/**
 * Identify a book from a cover photo using OpenAI GPT-4o vision.
 * Takes a base64-encoded image, extracts title/author via vision AI,
 * then searches Google Books with the extracted info.
 * Returns the same shape as the search action.
 */
export const identifyCover = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, args): Promise<BookResult[]> => {
    const openai = new OpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You are a book identification assistant. Given an image of a book cover, extract the title and author. Respond with JSON: {"title": "...", "author": "..."}. If you cannot determine the title, set title to an empty string. If you cannot determine the author, set author to an empty string.',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What book is shown in this image? Extract the title and author from the cover.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${args.imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Vision AI returned an empty response");
    }

    const parsed = JSON.parse(raw) as { title: string; author: string };

    if (!parsed.title) {
      throw new Error(
        "Could not identify the book from this image. Try taking a clearer photo of the front cover."
      );
    }

    // Build a search query from the extracted title and author
    const query = parsed.author
      ? `${parsed.title} ${parsed.author}`
      : parsed.title;

    // Reuse the existing Google Books search + enrichment + upsert flow
    const googleResults = await searchGoogleBooks(query, 5);

    const books: BookResult[] = await Promise.all(
      googleResults.map(async (item) => {
        const parsedBook = parseGoogleBooksItem(item);

        if (!parsedBook.description || !parsedBook.categories?.length) {
          const enrichment = await fetchOpenLibraryData(
            parsedBook.isbn13 ?? parsedBook.isbn10,
            parsedBook.title,
            parsedBook.authors[0]
          );
          if (enrichment) {
            parsedBook.description =
              parsedBook.description || enrichment.description;
            parsedBook.categories = parsedBook.categories?.length
              ? parsedBook.categories
              : enrichment.subjects;
            parsedBook.openLibraryKey = enrichment.key;
            parsedBook.coverUrl = parsedBook.coverUrl || enrichment.coverUrl;
          }
        }

        const bookId = await ctx.runMutation(internal.books.upsert, parsedBook);

        return {
          _id: bookId,
          ...parsedBook,
        };
      })
    );

    return books;
  },
});
