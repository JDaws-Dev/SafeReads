"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  ScanBarcode,
  Shield,
  Users,
  Heart,
  Camera,
  Sparkles,
  Infinity,
  Check,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show nothing while redirecting signed-in users
  if (isLoading) {
    return <div className="min-h-[calc(100vh-4rem)]" />;
  }
  if (isAuthenticated) {
    return <div className="min-h-[calc(100vh-4rem)]" />;
  }

  const handleSignIn = () => {
    void signIn("google");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <BookOpen className="mx-auto h-12 w-12 text-parchment-600 sm:h-16 sm:w-16" />
          <h1 className="mt-6 font-serif text-3xl font-bold text-ink-900 sm:text-5xl">
            Every parent deserves to know
            <br />
            <span className="text-parchment-700">what&apos;s inside the book</span>
          </h1>
          <p className="mt-4 text-base text-ink-500 sm:mt-6 sm:text-lg">
            Scan a barcode at the bookstore, snap a cover at the library, or
            search any title — SafeReads breaks down violence, language, sexual
            content, and 7 more categories so you can decide what&apos;s right
            for your family.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <button
              onClick={handleSignIn}
              className="w-full rounded-lg bg-parchment-700 px-8 py-3 text-base font-semibold text-parchment-50 transition-colors hover:bg-parchment-800 sm:w-auto"
            >
              Get Started — It&apos;s Free
            </button>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-700"
            >
              See how it works &darr;
            </a>
          </div>
        </div>
      </section>

      {/* App Demo Video - iPhone Wrapper */}
      <section className="mx-auto max-w-xs sm:max-w-sm px-4 pb-16 sm:pb-20">
        <div className="relative mx-auto rounded-[3rem] bg-ink-900 p-3 shadow-2xl">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-5 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
          {/* Screen */}
          <div className="overflow-hidden rounded-[2.5rem] bg-black">
            <video
              className="w-full"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            >
              <source src="/safereads-app-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-y border-parchment-200 bg-parchment-100/50 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Look up any book in seconds
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <Step
              icon={<ScanBarcode className="h-8 w-8" />}
              title="Scan the barcode"
              description="Point your camera at the ISBN barcode on the back cover for an instant lookup."
            />
            <Step
              icon={<Camera className="h-8 w-8" />}
              title="Snap the cover"
              description="Take a photo of the front cover and our AI will identify the book."
            />
            <Step
              icon={<BookOpen className="h-8 w-8" />}
              title="Search by title"
              description="Type a title, author, or ISBN to search our database of millions of books."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Built for parents who read the fine print
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Feature
              icon={<Shield className="h-6 w-6 text-verdict-safe" />}
              title="AI Content Review"
              description="Get detailed breakdowns of violence, language, sexual content, substance use, and dark themes — powered by GPT-4o."
            />
            <Feature
              icon={<ScanBarcode className="h-6 w-6 text-parchment-600" />}
              title="Instant Book Lookup"
              description="Scan a barcode or snap a photo. SafeReads identifies the book and pulls metadata from Google Books and Open Library."
            />
            <Feature
              icon={<Users className="h-6 w-6 text-parchment-600" />}
              title="Built for Families"
              description="Add your kids, manage wishlists, and keep track of books you've reviewed. One account for the whole family."
            />
            <Feature
              icon={<Heart className="h-6 w-6 text-verdict-caution" />}
              title="Your Values, Your Choice"
              description="SafeReads gives you the facts about what's in a book. You decide what's right for your family."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-y border-parchment-200 bg-parchment-100/50 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-center text-ink-500">
            Try before you buy. Upgrade when you&apos;re ready.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8 mx-auto max-w-3xl">
            {/* Trial tier */}
            <div className="rounded-xl border border-parchment-200 bg-white p-6">
              <h3 className="font-serif text-lg font-bold text-ink-900">Free Trial</h3>
              <p className="mt-1 text-3xl font-bold text-ink-900">
                3 reviews
                <span className="text-sm font-normal text-ink-500"> included</span>
              </p>
              <ul className="mt-5 space-y-3 text-sm text-ink-600">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Try the full experience
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Full content breakdowns
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Barcode &amp; cover scanning
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Kids &amp; wishlists
                </li>
              </ul>
              <button
                onClick={handleSignIn}
                className="mt-6 w-full rounded-lg border border-parchment-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-parchment-50"
              >
                Get Started
              </button>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-xl border-2 border-parchment-600 bg-white p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-parchment-700 px-3 py-0.5 text-xs font-semibold text-parchment-50">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-ink-900">Pro</h3>
              <p className="mt-1 text-3xl font-bold text-ink-900">
                $2.99
                <span className="text-sm font-normal text-ink-500">/month</span>
              </p>
              <ul className="mt-5 space-y-3 text-sm text-ink-600">
                <li className="flex items-start gap-2">
                  <Infinity className="mt-0.5 h-4 w-4 shrink-0 text-parchment-700" />
                  Unlimited book reviews
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Priority support
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  All features unlocked
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verdict-safe" />
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={handleSignIn}
                className="mt-6 w-full rounded-lg bg-parchment-700 px-4 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800"
              >
                Start Free, Upgrade Later
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Social Proof */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            We give you facts, not opinions
          </h2>
          <p className="mt-4 text-ink-500">
            Other sites tell you what to think. SafeReads tells you what&apos;s
            in the book — violence, language, sexual content, dark themes, and
            more — and lets you decide what&apos;s right for your family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-ink-400">
            <span>10 content categories reviewed</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>No agenda, just clarity</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>Free trial, 3 reviews</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Stop guessing. Start knowing.
          </h2>
          <p className="mt-3 text-ink-500">
            Sign up in seconds with your Google account. Try 3 reviews free —
            no credit card needed.
          </p>
          <button
            onClick={handleSignIn}
            className="mt-6 rounded-lg bg-parchment-700 px-8 py-3 text-base font-semibold text-parchment-50 transition-colors hover:bg-parchment-800"
          >
            Get Started Free
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Step({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-parchment-200 text-parchment-700">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-lg font-bold text-ink-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-parchment-200 bg-white p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-serif text-lg font-bold text-ink-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-ink-500">{description}</p>
    </div>
  );
}
