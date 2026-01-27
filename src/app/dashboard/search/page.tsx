"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SearchBar } from "@/components/SearchBar";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { CoverScanner } from "@/components/CoverScanner";
import { BookCard, BookCardBook } from "@/components/BookCard";
import { BookOpen } from "lucide-react";

export default function SearchPage() {
  const searchBooks = useAction(api.books.search);
  const identifyCover = useAction(api.books.identifyCover);

  const [results, setResults] = useState<BookCardBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    try {
      const books = await searchBooks({ query });
      setResults(books as BookCardBook[]);
      setSearched(true);
    } catch {
      setError("Something went wrong while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
        Search Books
      </h1>
      <p className="mt-2 text-sm text-ink-500 sm:text-base">
        Find a book by title, author, ISBN, barcode, or cover photo.
      </p>

      <div className="mt-6 space-y-3">
        <SearchBar onSearch={handleSearch} loading={loading} />
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

      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((book: BookCardBook) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
