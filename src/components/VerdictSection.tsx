"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { computeProfileHash } from "../../convex/lib/profileHash";
import { VerdictCard, VerdictCardAnalysis } from "./VerdictCard";
import { ContentFlagList, ContentFlag } from "./ContentFlagList";
import { AnalyzeButton } from "./AnalyzeButton";
import Link from "next/link";

interface VerdictSectionProps {
  bookId: Id<"books">;
}

export function VerdictSection({ bookId }: VerdictSectionProps) {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const profile = useQuery(
    api.profiles.getByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const profileHash = profile
    ? computeProfileHash({
        violence: profile.violence,
        language: profile.language,
        sexualContent: profile.sexualContent,
        substanceUse: profile.substanceUse,
        darkThemes: profile.darkThemes,
        religiousSensitivity: profile.religiousSensitivity,
      })
    : null;

  const cachedAnalysis = useQuery(
    api.analyses.getByBookAndProfile,
    profileHash ? { bookId, profileHash } : "skip"
  );

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
    if (!profile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeAction({
        bookId,
        profileId: profile._id,
      });
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

  // No profile yet — prompt user to create one
  if (convexUser && profile === null) {
    return (
      <div className="rounded-xl border border-parchment-200 bg-white p-6 text-center">
        <p className="text-sm text-ink-600">
          Create a values profile to analyze this book&apos;s content.
        </p>
        <Link
          href="/dashboard/profiles"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  // Still loading user/profile data
  if (!convexUser || profile === undefined) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-ink-900">
          Content Analysis
        </h2>
        {profile && (
          <span className="text-xs text-ink-400">
            Profile: {profile.name}
          </span>
        )}
      </div>

      {analysis ? (
        <>
          <VerdictCard analysis={analysis} />
          <ContentFlagList flags={flags} />
        </>
      ) : (
        <div className="rounded-xl border border-parchment-200 bg-white p-6 text-center">
          <p className="mb-4 text-sm text-ink-600">
            Analyze this book against your &ldquo;{profile.name}&rdquo; profile.
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
