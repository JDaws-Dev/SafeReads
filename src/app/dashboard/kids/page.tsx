"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { KidForm, KidFormValues } from "@/components/KidForm";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2, X, User, BookOpen } from "lucide-react";
import Link from "next/link";

type Kid = {
  _id: Id<"kids">;
  name: string;
  age?: number;
  profileId?: Id<"profiles">;
};

type Profile = {
  _id: Id<"profiles">;
  name: string;
};

export default function KidsPage() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const kids = useQuery(
    api.kids.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  const profiles = useQuery(
    api.profiles.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const createKid = useMutation(api.kids.create);
  const updateKid = useMutation(api.kids.update);
  const removeKid = useMutation(api.kids.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kid | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Id<"kids"> | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(kid: Kid) {
    setEditing(kid);
    setDialogOpen(true);
  }

  async function handleSubmit(values: KidFormValues) {
    if (!convexUser) return;
    setSaving(true);
    try {
      if (editing) {
        await updateKid({
          kidId: editing._id,
          name: values.name,
          age: values.age,
          profileId: values.profileId,
        });
      } else {
        await createKid({
          userId: convexUser._id,
          name: values.name,
          age: values.age,
          profileId: values.profileId,
        });
      }
      setDialogOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(kidId: Id<"kids">) {
    setDeleting(kidId);
    try {
      await removeKid({ kidId });
    } finally {
      setDeleting(null);
    }
  }

  function getProfileName(profileId?: Id<"profiles">): string | null {
    if (!profileId || !profiles) return null;
    const profile = profiles.find((p: Profile) => p._id === profileId);
    return profile?.name ?? null;
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
            My Kids
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage your children and their reading wishlists.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
        >
          <Plus className="h-4 w-4" />
          Add Child
        </button>
      </div>

      {kids === undefined ? (
        <div className="py-12 text-center text-ink-500">Loading…</div>
      ) : kids.length === 0 ? (
        <div className="rounded-lg border border-parchment-200 bg-white p-8 text-center">
          <User className="mx-auto mb-3 h-10 w-10 text-ink-300" />
          <p className="text-ink-600">
            No kids added yet. Add a child to start building their reading
            wishlist.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
          >
            <Plus className="h-4 w-4" />
            Add Your First Child
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {kids.map((kid: Kid) => (
            <div
              key={kid._id}
              className="rounded-lg border border-parchment-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment-100">
                    <User className="h-4 w-4 text-parchment-600" />
                  </div>
                  <div>
                    <span className="font-medium text-ink-900">
                      {kid.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-ink-400">
                      {kid.age !== undefined && (
                        <span>Age {kid.age}</span>
                      )}
                      {getProfileName(kid.profileId) && (
                        <>
                          {kid.age !== undefined && <span>·</span>}
                          <span>{getProfileName(kid.profileId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/kids/${kid._id}/wishlist`}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-parchment-700 transition-colors hover:bg-parchment-100"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Wishlist
                  </Link>
                  <button
                    onClick={() => openEdit(kid as Kid)}
                    className="rounded p-1.5 text-ink-400 transition-colors hover:bg-parchment-100 hover:text-ink-600"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(kid._id)}
                    disabled={deleting === kid._id}
                    className="rounded p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-verdict-warning disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
                {editing ? "Edit Child" : "Add Child"}
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
            <KidForm
              initialValues={
                editing
                  ? {
                      name: editing.name,
                      age: editing.age,
                      profileId: editing.profileId,
                    }
                  : undefined
              }
              profiles={(profiles ?? []) as Profile[]}
              onSubmit={handleSubmit}
              submitLabel={editing ? "Update" : "Add Child"}
              loading={saving}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
