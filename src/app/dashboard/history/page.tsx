"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search, Clock, Trash2, StickyNote, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function HistoryPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkId ? { clerkId } : "skip"
  );

  const searches = useQuery(
    api.searchHistory.listByUser,
    convexUser?._id ? { userId: convexUser._id, count: 30 } : "skip"
  );

  const notes = useQuery(
    api.notes.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const clearAll = useMutation(api.searchHistory.clearAll);
  const [clearing, setClearing] = useState(false);

  async function handleClearHistory() {
    if (!convexUser?._id) return;
    setClearing(true);
    try {
      await clearAll({ userId: convexUser._id });
    } finally {
      setClearing(false);
    }
  }

  const [tab, setTab] = useState<"searches" | "notes">("searches");

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
        History
      </h1>
      <p className="mt-2 text-sm text-ink-500 sm:text-base">
        Your recent searches and book notes.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-parchment-100 p-1">
        <button
          onClick={() => setTab("searches")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "searches"
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          <Search className="h-4 w-4" />
          Searches
        </button>
        <button
          onClick={() => setTab("notes")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "notes"
              ? "bg-white text-ink-900 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </button>
      </div>

      {tab === "searches" && (
        <section className="mt-6">
          {searches === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-parchment-100"
                />
              ))}
            </div>
          ) : searches.length === 0 ? (
            <div className="rounded-lg border border-parchment-200 bg-white p-8 text-center">
              <Clock className="mx-auto h-10 w-10 text-parchment-300" />
              <p className="mt-3 text-sm text-ink-500">
                No searches yet. Search for a book to see your history here.
              </p>
              <Link
                href="/dashboard/search"
                className="mt-4 inline-block rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
              >
                Search Books
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-verdict-warning disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              </div>
              <div className="space-y-2">
                {searches.map((entry: SearchEntry) => (
                  <Link
                    key={entry._id}
                    href={`/dashboard/search?q=${encodeURIComponent(entry.query)}`}
                    className="group flex items-center gap-3 rounded-lg border border-parchment-200 bg-white p-3 transition-colors hover:border-parchment-300 hover:shadow-sm"
                  >
                    <Search className="h-4 w-4 flex-shrink-0 text-parchment-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900 group-hover:text-parchment-700">
                        {entry.query}
                      </p>
                      <p className="text-xs text-ink-400">
                        {entry.resultCount}{" "}
                        {entry.resultCount === 1 ? "result" : "results"}
                      </p>
                    </div>
                    <span className="text-xs text-ink-300">
                      {formatTime(entry._creationTime)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "notes" && (
        <section className="mt-6">
          {notes === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-parchment-100"
                />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-lg border border-parchment-200 bg-white p-8 text-center">
              <StickyNote className="mx-auto h-10 w-10 text-parchment-300" />
              <p className="mt-3 text-sm text-ink-500">
                No notes yet. Add notes to books from their detail page.
              </p>
              <Link
                href="/dashboard/search"
                className="mt-4 inline-block rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
              >
                Search Books
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note: NoteWithBook) => (
                <Link
                  key={note._id}
                  href={`/dashboard/book/${note.bookId}`}
                  className="group flex items-start gap-3 rounded-lg border border-parchment-200 bg-white p-3 transition-colors hover:border-parchment-300 hover:shadow-sm"
                >
                  <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-parchment-100">
                    {note.book?.coverUrl ? (
                      <Image
                        src={note.book.coverUrl}
                        alt={note.book.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-4 w-4 text-parchment-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900 group-hover:text-parchment-700">
                      {note.book?.title ?? "Unknown Book"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500">
                      {note.content}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Types for Convex data (AnyApi returns `any`)
interface SearchEntry {
  _id: string;
  _creationTime: number;
  query: string;
  resultCount: number;
}

interface NoteWithBook {
  _id: string;
  bookId: string;
  content: string;
  book: {
    title: string;
    coverUrl?: string;
  } | null;
}
