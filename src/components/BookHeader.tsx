"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";

export interface BookHeaderBook {
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  isbn13?: string;
  isbn10?: string;
}

interface BookHeaderProps {
  book: BookHeaderBook;
  actions?: React.ReactNode;
}

export function BookHeader({ book, actions }: BookHeaderProps) {
  const year = book.publishedDate?.slice(0, 4);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="relative h-64 w-44 flex-shrink-0 self-center overflow-hidden rounded-lg bg-parchment-100 shadow-md sm:self-start">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="176px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-parchment-300" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
          {book.title}
        </h1>
        <p className="mt-1 text-lg text-ink-600">
          {book.authors.join(", ")}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
          {year && <span>{year}</span>}
          {book.pageCount && <span>{book.pageCount} pages</span>}
          {book.isbn13 && <span>ISBN {book.isbn13}</span>}
          {!book.isbn13 && book.isbn10 && <span>ISBN {book.isbn10}</span>}
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {book.categories.map((cat: string) => (
              <span
                key={cat}
                className="rounded-full bg-parchment-100 px-2.5 py-0.5 text-xs text-ink-600"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {book.description && (
          <p className="mt-4 text-sm leading-relaxed text-ink-700">
            {book.description}
          </p>
        )}

        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
