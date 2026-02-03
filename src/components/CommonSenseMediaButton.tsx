"use client";

import { ExternalLink } from "lucide-react";

interface CommonSenseMediaButtonProps {
  title: string;
}

function buildCommonSenseMediaUrl(title: string): string {
  // Search by title only - cleaner results than title + author
  return `https://www.commonsensemedia.org/search/${encodeURIComponent(title)}?type=book_reviews`;
}

export function CommonSenseMediaButton({ title }: CommonSenseMediaButtonProps) {
  const url = buildCommonSenseMediaUrl(title);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-parchment-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-parchment-400 hover:bg-parchment-50"
    >
      Common Sense Media
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
