"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { VerdictCard, VerdictCardAnalysis } from "./VerdictCard";
import { ContentFlagList, ContentFlag } from "./ContentFlagList";
import { AnalyzeButton } from "./AnalyzeButton";
import { ReportButton } from "./ReportButton";
import { ShareVerdictButton } from "./ShareVerdictButton";
import { UpgradePrompt } from "./UpgradePrompt";
import { useNotification } from "@/hooks/useNotification";
import { RefreshCw } from "lucide-react";

interface VerdictSectionProps {
  bookId: Id<"books">;
  bookTitle: string;
}

export function VerdictSection({ bookId, bookTitle }: VerdictSectionProps) {
  const cachedAnalysis = useQuery(api.analyses.getByBook, { bookId });
  const { user } = useUser();
  const clerkId = user?.id;
  const access = useQuery(
    api.subscriptions.checkAccess,
    clerkId ? { clerkId } : "skip"
  ) as { hasAccess: boolean; freeRemaining: number; isSubscribed: boolean } | undefined;
  const { notify } = useNotification();

  const analyzeAction = useAction(api.analyses.analyze);
  const reanalyzeAction = useAction(api.analyses.reanalyze);
  const [analyzing, setAnalyzing] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [actionResult, setActionResult] = useState<{
    verdict: string;
    summary: string;
    ageRecommendation?: string;
    reasoning?: string;
    contentFlags: ContentFlag[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeAction({ bookId, clerkId });
      setActionResult(result as typeof actionResult);
      notify(`SafeReads: ${bookTitle}`, {
        body: `Analysis complete — ${(result as { verdict: string }).verdict.replace("_", " ")}`,
        tag: `analysis-${bookId as string}`,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("UPGRADE_REQUIRED")) {
        setShowUpgrade(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Analysis failed. Please try again."
        );
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    setError(null);
    try {
      const result = await reanalyzeAction({ bookId, clerkId });
      setActionResult(result as typeof actionResult);
      notify(`SafeReads: ${bookTitle}`, {
        body: `Re-analysis complete — ${(result as { verdict: string }).verdict.replace("_", " ")}`,
        tag: `analysis-${bookId as string}`,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("UPGRADE_REQUIRED")) {
        setShowUpgrade(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Re-analysis failed. Please try again."
        );
      }
    } finally {
      setReanalyzing(false);
    }
  }

  // Determine which analysis to display (cached query result or fresh action result)
  const analysis: VerdictCardAnalysis | null = cachedAnalysis
    ? {
        verdict: cachedAnalysis.verdict,
        summary: cachedAnalysis.summary,
        ageRecommendation: cachedAnalysis.ageRecommendation,
        reasoning: cachedAnalysis.reasoning,
      }
    : actionResult
      ? {
          verdict: actionResult.verdict as VerdictCardAnalysis["verdict"],
          summary: actionResult.summary,
          ageRecommendation: actionResult.ageRecommendation,
          reasoning: actionResult.reasoning,
        }
      : null;

  const flags: ContentFlag[] =
    (cachedAnalysis?.contentFlags as ContentFlag[] | undefined) ??
    actionResult?.contentFlags ??
    [];

  // Free tier banner: show remaining count for non-subscribed users without a cached analysis
  const showFreeBanner = access && !access.isSubscribed && !analysis;

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-ink-900">
        Content Analysis
      </h2>

      {showFreeBanner && (
        <div className="rounded-lg border border-parchment-300 bg-parchment-50 px-4 py-2.5 text-sm text-ink-600">
          {access.freeRemaining > 0
            ? `${access.freeRemaining} of 3 free analyses remaining`
            : "You\u2019ve used all 3 free analyses"}
        </div>
      )}

      {analysis ? (
        <>
          <VerdictCard analysis={analysis} />
          <ContentFlagList flags={flags} />
          <div className="flex items-center justify-end gap-2">
            {analysis && (
              <ShareVerdictButton
                bookTitle={bookTitle}
                verdict={analysis.verdict}
                summary={analysis.summary}
                ageRecommendation={analysis.ageRecommendation}
                bookUrl={typeof window !== "undefined" ? window.location.href : ""}
              />
            )}
            {cachedAnalysis?._id && (
              <ReportButton
                bookId={bookId}
                analysisId={cachedAnalysis._id}
              />
            )}
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-parchment-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-parchment-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${reanalyzing ? "animate-spin" : ""}`}
              />
              {reanalyzing ? "Re-analyzing\u2026" : "Re-analyze"}
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-parchment-200 bg-white p-6 text-center">
          <p className="mb-4 text-sm text-ink-600">
            Get an objective content review of this book.
          </p>
          <AnalyzeButton
            onClick={handleAnalyze}
            loading={analyzing}
            disabled={access !== undefined && !access.hasAccess}
          />
          {access && !access.hasAccess && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="mt-3 text-sm font-medium text-parchment-700 underline underline-offset-2 hover:text-parchment-800"
            >
              Upgrade to unlock more analyses
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showUpgrade && (
        <UpgradePrompt onDismiss={() => setShowUpgrade(false)} />
      )}
    </div>
  );
}
