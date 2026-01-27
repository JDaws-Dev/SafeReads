"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  ValuesProfileForm,
  SensitivityValues,
} from "@/components/ValuesProfileForm";

export default function ProfilesPage() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const profile = useQuery(
    api.profiles.getByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const upsertProfile = useMutation(api.profiles.upsert);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(name: string, values: SensitivityValues) {
    if (!convexUser) return;
    setSaving(true);
    setSaved(false);
    try {
      await upsertProfile({ userId: convexUser._id, name, ...values });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="py-12 text-center text-ink-500">Loading…</div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="py-12 text-center text-ink-500">Loading profile…</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-ink-900">
          Values Profile
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Set your sensitivity preferences to customize book content analysis.
        </p>
      </div>

      <div className="rounded-xl border border-parchment-200 bg-white p-6">
        <ValuesProfileForm
          initialName={profile?.name}
          initialValues={
            profile
              ? {
                  violence: profile.violence,
                  language: profile.language,
                  sexualContent: profile.sexualContent,
                  substanceUse: profile.substanceUse,
                  darkThemes: profile.darkThemes,
                  religiousSensitivity: profile.religiousSensitivity,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          submitLabel={profile ? "Save Profile" : "Create Profile"}
          loading={saving}
        />
        {saved && (
          <p className="mt-3 text-center text-sm text-green-600">
            Profile saved.
          </p>
        )}
      </div>
    </div>
  );
}
