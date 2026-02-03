"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { SearchBar } from "@/components/SearchBar";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { CoverScanner } from "@/components/CoverScanner";
import { BookCard, BookCardBook } from "@/components/BookCard";
import { AuthorCard, AuthorCardData } from "@/components/AuthorCard";
import { BookOpen, Search, Trash2 } from "lucide-react";

export default function SearchPage() {
  const currentUser = useQuery(api.users.currentUser);

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const searchBooks = useAction(api.books.search);
  const searchByAuthor = useAction(api.books.searchByAuthor);
  const identifyCover = useAction(api.books.identifyCover);
  const recordSearch = useMutation(api.searchHistory.record);
  const clearAllHistory = useMutation(api.searchHistory.clearAll);

  const searches = useQuery(
    api.searchHistory.listByUser,
    currentUser?._id ? { userId: currentUser._id, count: 10 } : "skip"
  );

  const [results, setResults] = useState<BookCardBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [authorMatch, setAuthorMatch] = useState<AuthorCardData | null>(null);
  const autoSearched = useRef(false);

  const handleSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      setAuthorMatch(null);
      try {
        // Run general search and inauthor: search in parallel.
        // The inauthor: search detects if the query is an author name.
        const [books, authorCatalogRaw] = await Promise.all([
          searchBooks({ query }),
          searchByAuthor({ authorName: query, maxResults: 10 }).catch(
            () => [] as BookCardBook[]
          ),
        ]);
        const bookResults = books as BookCardBook[];
        const authorCatalog = authorCatalogRaw as BookCardBook[];
        setResults(bookResults);
        setSearched(true);

        // Author detection: check if title search results have a dominant author
        // This is more reliable than the inauthor: search which can match unrelated people
        if (bookResults.length >= 2) {
          // Fallback: ≥50% of general results share the same author
          const authorCounts = new Map<string, number>();
          for (const book of bookResults) {
            for (const author of book.authors) {
              const normalized = author.toLowerCase().trim();
              authorCounts.set(
                normalized,
                (authorCounts.get(normalized) ?? 0) + 1
              );
            }
          }
          let topAuthor = "";
          let topCount = 0;
          for (const [author, count] of authorCounts) {
            if (count > topCount) {
              topAuthor = author;
              topCount = count;
            }
          }
          if (topCount >= Math.ceil(bookResults.length / 2)) {
            const matchingBook = bookResults.find((b) =>
              b.authors.some(
                (a) => a.toLowerCase().trim() === topAuthor
              )
            );
            const displayName =
              matchingBook?.authors.find(
                (a) => a.toLowerCase().trim() === topAuthor
              ) ?? topAuthor;
            const authorBooks = bookResults.filter((b) =>
              b.authors.some(
                (a) => a.toLowerCase().trim() === topAuthor
              )
            );
            const allCategories = authorBooks.flatMap(
              (b) => b.categories ?? []
            );

            setAuthorMatch({
              name: displayName,
              bookCount: authorBooks.length,
              topBooks: authorBooks.slice(0, 4).map((b) => ({
                title: b.title,
                coverUrl: b.coverUrl,
              })),
              categories: [...new Set(allCategories)].slice(0, 5),
            });
          }
        }

        // Record search in history
        if (currentUser?._id) {
          recordSearch({
            userId: currentUser._id,
            query,
            resultCount: books.length,
          }).catch(() => {
            // Best-effort — don't break search if history recording fails
          });
        }
      } catch {
        setError("Something went wrong while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [searchBooks, searchByAuthor, currentUser, recordSearch]
  );

  // Auto-trigger search from ?q= query param
  useEffect(() => {
    if (initialQuery && !autoSearched.current) {
      autoSearched.current = true;
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  async function handleCoverCapture(imageBase64: string) {
    setLoading(true);
    setError(null);
    try {
      const books = await identifyCover({ imageBase64 });
      setResults(books as BookCardBook[]);
      setSearched(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not identify the book.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    if (!currentUser?._id) return;
    setClearing(true);
    try {
      await clearAllHistory({ userId: currentUser._id });
    } finally {
      setClearing(false);
    }
  }

  const showRecentSearches = !searched && !loading && !error;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
        Search Books
      </h1>
      <p className="mt-2 text-sm text-ink-500 sm:text-base">
        Find a book by title, author, ISBN, barcode, or cover photo.
      </p>

      <div className="mt-6 space-y-3">
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          initialQuery={initialQuery}
        />
        <div className="flex gap-2">
          <BarcodeScanner onScan={handleSearch} disabled={loading} />
          <CoverScanner onCapture={handleCoverCapture} disabled={loading} />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-verdict-warning/30 bg-red-50 p-4 text-sm text-verdict-warning">
          {error}
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div className="mt-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-parchment-300" />
          <p className="mt-3 text-ink-500">
            No books found. Try a different search term.
          </p>
        </div>
      )}

      {/* Author card — shown when results strongly match one author */}
      {authorMatch && (
        <div className="mt-6">
          <AuthorCard author={authorMatch} />
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((book: BookCardBook) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}

      {/* Recent Searches — shown when idle (no active search) */}
      {showRecentSearches && searches && searches.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink-500">
              Recent Searches
            </h2>
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center gap-1 text-xs font-medium text-ink-400 transition-colors hover:text-verdict-warning disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {clearing ? "Clearing…" : "Clear"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searches.map((entry: SearchEntry) => (
              <button
                key={entry._id}
                onClick={() => handleSearch(entry.query)}
                className="inline-flex items-center gap-1.5 rounded-full border border-parchment-200 bg-white px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-parchment-300 hover:bg-parchment-50"
              >
                <Search className="h-3 w-3 text-parchment-400" />
                {entry.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Types for Convex data (AnyApi returns `any`)
interface SearchEntry {
  _id: string;
  _creationTime: number;
  query: string;
  resultCount: number;
}
