"use client";

import { ExternalLink } from "lucide-react";

interface CommonSenseMediaButtonProps {
  title: string;
}

function buildCommonSenseMediaUrl(title: string): string {
  // Try direct link to book review using slugified title
  // CSM uses format: /book-reviews/[lowercase-hyphenated-title]
  const slug = title
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .trim();
  return `https://www.commonsensemedia.org/book-reviews/${slug}`;
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
