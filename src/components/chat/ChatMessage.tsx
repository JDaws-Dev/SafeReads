"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { Components } from "react-markdown";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => {
    // Check if this bold text looks like a book title (inside a numbered list context)
    const text = typeof children === "string" ? children : "";
    if (text && /^[""]?[A-Z]/.test(text)) {
      return (
        <Link
          href={`/dashboard/search?q=${encodeURIComponent(text.replace(/^[""]|[""]$/g, ""))}`}
          className="font-semibold text-parchment-800 underline decoration-parchment-400 underline-offset-2 hover:decoration-parchment-700"
        >
          {children}
        </Link>
      );
    }
    return <strong className="font-semibold">{children}</strong>;
  },
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-parchment-700 underline hover:text-parchment-900"
    >
      {children}
    </a>
  ),
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-parchment-700 text-parchment-50"
            : "bg-parchment-200 text-ink-600"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-parchment-700 text-parchment-50"
            : "bg-parchment-100 text-ink-800"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <ReactMarkdown components={markdownComponents}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
