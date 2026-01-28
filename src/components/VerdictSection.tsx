"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { VerdictCard, VerdictCardAnalysis } from "./VerdictCard";
import { ContentFlagList, ContentFlag } from "./ContentFlagList";
import { AnalyzeButton } from "./AnalyzeButton";
import { ReportButton } from "./ReportButton";
import { RefreshCw } from "lucide-react";

interface VerdictSectionProps {
  bookId: Id<"books">;
}

export function VerdictSection({ bookId }: VerdictSectionProps) {
  const cachedAnalysis = useQuery(api.analyses.getByBook, { bookId });

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

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeAction({ bookId });
      setActionResult(result as typeof actionResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    setError(null);
    try {
      const result = await reanalyzeAction({ bookId });
      setActionResult(result as typeof actionResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Re-analysis failed. Please try again."
      );
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

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-ink-900">
        Content Analysis
      </h2>

      {analysis ? (
        <>
          <VerdictCard analysis={analysis} />
          <ContentFlagList flags={flags} />
          <div className="flex items-center justify-end gap-2">
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
              {reanalyzing ? "Re-analyzing…" : "Re-analyze"}
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-parchment-200 bg-white p-6 text-center">
          <p className="mb-4 text-sm text-ink-600">
            Get an objective content review of this book.
          </p>
          <AnalyzeButton onClick={handleAnalyze} loading={analyzing} />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
