"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  ValuesProfileForm,
  SensitivityValues,
} from "@/components/ValuesProfileForm";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, Star, X } from "lucide-react";

type Profile = {
  _id: Id<"profiles">;
  name: string;
  violence: number;
  language: number;
  sexualContent: number;
  substanceUse: number;
  darkThemes: number;
  religiousSensitivity: number;
  isDefault: boolean;
};

export default function ProfilesPage() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const profiles = useQuery(
    api.profiles.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const createProfile = useMutation(api.profiles.create);
  const updateProfile = useMutation(api.profiles.update);
  const removeProfile = useMutation(api.profiles.remove);
  const setDefault = useMutation(api.profiles.setDefault);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Id<"profiles"> | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(profile: Profile) {
    setEditing(profile);
    setDialogOpen(true);
  }

  async function handleSubmit(name: string, values: SensitivityValues) {
    if (!convexUser) return;
    setSaving(true);
    try {
      if (editing) {
        await updateProfile({ profileId: editing._id, name, ...values });
      } else {
        await createProfile({ userId: convexUser._id, name, ...values });
      }
      setDialogOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(profileId: Id<"profiles">) {
    setDeleting(profileId);
    try {
      await removeProfile({ profileId });
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetDefault(profileId: Id<"profiles">) {
    await setDefault({ profileId });
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="py-12 text-center text-ink-500">Loading…</div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Values Profiles
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Create profiles to customize content analysis for different readers
            or age groups.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
        >
          <Plus className="h-4 w-4" />
          New Profile
        </button>
      </div>

      {profiles === undefined ? (
        <div className="py-12 text-center text-ink-500">Loading profiles…</div>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-parchment-200 bg-white p-8 text-center">
          <p className="text-ink-600">
            No profiles yet. Create one to get started with book analysis.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
          >
            <Plus className="h-4 w-4" />
            Create Your First Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile: Profile) => (
            <div
              key={profile._id}
              className="flex items-center justify-between rounded-lg border border-parchment-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {profile.isDefault && (
                  <Star className="h-4 w-4 fill-parchment-500 text-parchment-500" />
                )}
                <div>
                  <span className="font-medium text-ink-900">
                    {profile.name}
                  </span>
                  {profile.isDefault && (
                    <span className="ml-2 text-xs text-ink-400">Default</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!profile.isDefault && (
                  <button
                    onClick={() => handleSetDefault(profile._id)}
                    className="rounded p-1.5 text-ink-400 transition-colors hover:bg-parchment-100 hover:text-ink-600"
                    title="Set as default"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(profile as Profile)}
                  className="rounded p-1.5 text-ink-400 transition-colors hover:bg-parchment-100 hover:text-ink-600"
                  title="Edit profile"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={() => handleDelete(profile._id)}
                    disabled={deleting === profile._id}
                    className="rounded p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-verdict-warning disabled:opacity-50"
                    title="Delete profile"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-parchment-50 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-serif text-xl font-bold text-ink-900">
                {editing ? "Edit Profile" : "New Profile"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded p-1 text-ink-400 hover:text-ink-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <ValuesProfileForm
              initialName={editing?.name}
              initialValues={
                editing
                  ? {
                      violence: editing.violence,
                      language: editing.language,
                      sexualContent: editing.sexualContent,
                      substanceUse: editing.substanceUse,
                      darkThemes: editing.darkThemes,
                      religiousSensitivity: editing.religiousSensitivity,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              submitLabel={editing ? "Update Profile" : "Create Profile"}
              loading={saving}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
