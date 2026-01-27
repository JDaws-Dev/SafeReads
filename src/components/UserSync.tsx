"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

/**
 * Syncs the Clerk user into Convex on sign-in.
 * Renders nothing — just runs the upsert effect.
 */
export function UserSync() {
  const { user, isLoaded } = useUser();
  const upsert = useMutation(api.users.upsert);
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || synced.current) return;
    synced.current = true;

    upsert({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
    });
  }, [isLoaded, user, upsert]);

  return null;
}
