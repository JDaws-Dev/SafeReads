"use client";

import { useState } from "react";
import { X, Sparkles, BookOpen, Infinity, Heart } from "lucide-react";

interface UpgradePromptProps {
  onDismiss: () => void;
}

export function UpgradePrompt({ onDismiss }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-xl">
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 text-ink-400 hover:text-ink-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-parchment-700" />
          <h3 className="font-serif text-xl font-bold text-ink-900">
            Upgrade to SafeReads Pro
          </h3>
        </div>

        <p className="mb-5 text-sm text-ink-600">
          You&apos;ve used all your free reviews. Upgrade to continue
          reviewing books for your family.
        </p>

        <div className="mb-5 rounded-lg border border-parchment-200 bg-parchment-50 p-4">
          <p className="mb-3 text-lg font-semibold text-ink-900">
            $2.99<span className="text-sm font-normal text-ink-500">/month</span>
          </p>
          <ul className="space-y-2 text-sm text-ink-700">
            <li className="flex items-center gap-2">
              <Infinity className="h-4 w-4 text-parchment-700" />
              Unlimited book reviews
            </li>
            <li className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-parchment-700" />
              Priority support
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-parchment-700" />
              Full content breakdowns
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-lg bg-parchment-700 px-4 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Redirecting to checkout…" : "Upgrade Now"}
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-parchment-50 sm:hidden"
          >
            Maybe later
          </button>
          <button
            onClick={onDismiss}
            className="hidden w-full rounded-lg px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-parchment-50 sm:block"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
