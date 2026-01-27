"use client";

import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-ink-900">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-2 text-ink-500">
        Search for a book to get started with your content analysis.
      </p>
    </div>
  );
}
