"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SearchBar } from "@/components/SearchBar";
import { BookCard, BookCardBook } from "@/components/BookCard";
import { BookOpen } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const searchBooks = useAction(api.books.search);

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

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-ink-900">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-2 text-ink-500">
        Search for a book to get started with your content analysis.
      </p>

      <div className="mt-6">
        <SearchBar onSearch={handleSearch} loading={loading} />
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
