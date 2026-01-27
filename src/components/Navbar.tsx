"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-parchment-200 bg-parchment-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-parchment-700" />
          <span className="font-serif text-xl font-bold text-ink-900">
            SafeReads
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/profiles"
              className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              Profiles
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-parchment-700 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
