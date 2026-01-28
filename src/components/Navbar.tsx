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
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                Home
              </Link>
              <Link
                href="/dashboard/search"
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                Search
              </Link>
              <Link
                href="/dashboard/history"
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                History
              </Link>
              <Link
                href="/dashboard/kids"
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                Kids
              </Link>
              <Link
                href="/dashboard/chat"
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                Chat
              </Link>
            </div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Settings"
                  labelIcon={<SettingsIcon />}
                  href="/dashboard/settings"
                />
              </UserButton.MenuItems>
            </UserButton>
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

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M6.955 1.45A.5.5 0 0 1 7.452 1h1.096a.5.5 0 0 1 .497.45l.17 1.699c.484.12.94.312 1.356.562l1.321-.916a.5.5 0 0 1 .67.055l.775.776a.5.5 0 0 1 .055.67l-.916 1.32c.25.417.443.873.563 1.357l1.699.17a.5.5 0 0 1 .45.497v1.096a.5.5 0 0 1-.45.497l-1.699.17c-.12.484-.312.94-.562 1.356l.916 1.321a.5.5 0 0 1-.055.67l-.776.776a.5.5 0 0 1-.67.054l-1.32-.916a5.44 5.44 0 0 1-1.357.563l-.17 1.699a.5.5 0 0 1-.497.45H7.452a.5.5 0 0 1-.497-.45l-.17-1.699a5.44 5.44 0 0 1-1.356-.562l-1.321.916a.5.5 0 0 1-.67-.055l-.775-.776a.5.5 0 0 1-.055-.67l.916-1.32a5.44 5.44 0 0 1-.563-1.357l-1.699-.17A.5.5 0 0 1 1 8.548V7.452a.5.5 0 0 1 .45-.497l1.699-.17c.12-.484.312-.94.562-1.356l-.916-1.321a.5.5 0 0 1 .055-.67l.776-.776a.5.5 0 0 1 .67-.054l1.32.916a5.44 5.44 0 0 1 1.357-.563l.17-1.699ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
