import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

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
  handler: async (ctx, args) => {
    const maxResults = args.maxResults ?? 10;
    const googleResults = await searchGoogleBooks(args.query, maxResults);

    const books = await Promise.all(
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

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Google Books API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as GoogleBooksResponse;
  return data.items ?? [];
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
