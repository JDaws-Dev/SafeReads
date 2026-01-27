"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { VerdictCard, VerdictCardAnalysis } from "./VerdictCard";
import { ContentFlagList, ContentFlag } from "./ContentFlagList";
import { AnalyzeButton } from "./AnalyzeButton";

interface VerdictSectionProps {
  bookId: Id<"books">;
}

export function VerdictSection({ bookId }: VerdictSectionProps) {
  const cachedAnalysis = useQuery(api.analyses.getByBook, { bookId });

  const analyzeAction = useAction(api.analyses.analyze);
  const [analyzing, setAnalyzing] = useState(false);
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
