"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Crown,
  CreditCard,
  Sparkles,
  BookOpen,
  Infinity,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const clerkId = user?.id;
  const details = useQuery(
    api.subscriptions.getDetails,
    clerkId ? { clerkId } : "skip"
  ) as {
    isSubscribed: boolean;
    status: string | null;
    currentPeriodEnd: number | null;
    analysisCount: number;
    freeRemaining: number;
  } | undefined;

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutLoading(false);
    }
  }

  async function handleManage() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalLoading(false);
      }
    } catch {
      setPortalLoading(false);
    }
  }

  const renewalDate = details?.currentPeriodEnd
    ? new Date(details.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl font-bold text-ink-900">Settings</h1>

      {/* Subscription Section */}
      <div className="rounded-xl border border-parchment-200 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">
          Subscription
        </h2>

        {!details ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-parchment-400" />
          </div>
        ) : details.isSubscribed ? (
          /* Subscribed state */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-ink-900">
                SafeReads Pro
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Premium
              </span>
            </div>

            <div className="space-y-2 text-sm text-ink-600">
              <p>
                Status:{" "}
                <span className="font-medium capitalize text-ink-900">
                  {details.status}
                </span>
              </p>
              {renewalDate && (
                <p>
                  {details.status === "canceled"
                    ? "Access until: "
                    : "Renews: "}
                  <span className="font-medium text-ink-900">
                    {renewalDate}
                  </span>
                </p>
              )}
              <p>
                Total analyses:{" "}
                <span className="font-medium text-ink-900">
                  {details.analysisCount}
                </span>
              </p>
            </div>

            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-parchment-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-parchment-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {portalLoading
                ? "Opening portal\u2026"
                : "Manage Subscription"}
            </button>
          </div>
        ) : (
          /* Free tier state */
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-ink-600">
              <p>
                Plan:{" "}
                <span className="font-medium text-ink-900">Free</span>
              </p>
              <p>
                Analyses used:{" "}
                <span className="font-medium text-ink-900">
                  {details.analysisCount} of 3
                </span>
              </p>
              <p>
                Remaining:{" "}
                <span className="font-medium text-ink-900">
                  {details.freeRemaining}
                </span>
              </p>
            </div>

            {/* Pricing card */}
            <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-parchment-700" />
                <span className="font-semibold text-ink-900">
                  Upgrade to SafeReads Pro
                </span>
              </div>
              <p className="mb-3 text-lg font-semibold text-ink-900">
                $2.99
                <span className="text-sm font-normal text-ink-500">
                  /month
                </span>
              </p>
              <ul className="mb-4 space-y-2 text-sm text-ink-700">
                <li className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-parchment-700" />
                  Unlimited book analyses
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-parchment-700" />
                  Re-analyze any book anytime
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-parchment-700" />
                  Full content breakdowns
                </li>
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full rounded-lg bg-parchment-700 px-4 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkoutLoading
                  ? "Redirecting to checkout\u2026"
                  : "Upgrade Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
