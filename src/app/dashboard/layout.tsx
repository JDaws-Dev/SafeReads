"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { UserSync } from "@/components/UserSync";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const convexUser = useQuery(
    api.users.getByClerkId,
    isLoaded && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user || convexUser === undefined) return;
    // convexUser is null → UserSync hasn't created the user yet; wait
    if (convexUser === null) return;
    if (!convexUser.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [isLoaded, user, convexUser, router]);

  // Always render UserSync so user gets created in Convex
  // Show nothing else while checking onboarding status
  if (!isLoaded || !user || convexUser === undefined || convexUser === null) {
    return <UserSync />;
  }

  if (!convexUser.onboardingComplete) {
    return <UserSync />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <UserSync />
      {children}
    </div>
  );
}
