"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        onSearch(trimmed);
      }
    },
    [query, onSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a book by title, author, or ISBN…"
          className="w-full rounded-lg border border-parchment-200 bg-white py-3 pl-10 pr-24 text-ink-900 placeholder:text-ink-400 focus:border-parchment-400 focus:outline-none focus:ring-2 focus:ring-parchment-300"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-parchment-700 px-4 py-1.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
