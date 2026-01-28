"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  ScanBarcode,
  Shield,
  Users,
  Heart,
  Camera,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Don't render landing page while checking auth or if signed in
  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <BookOpen className="mx-auto h-12 w-12 text-parchment-600 sm:h-16 sm:w-16" />
          <h1 className="mt-6 font-serif text-3xl font-bold text-ink-900 sm:text-5xl">
            Know what&apos;s in the book
            <br />
            <span className="text-parchment-700">before your kid reads it</span>
          </h1>
          <p className="mt-4 text-base text-ink-500 sm:mt-6 sm:text-lg">
            SafeReads uses AI to analyze book content so you can make informed
            decisions about what your children read. Scan a barcode, snap a
            cover, or search by title — get a detailed content breakdown in
            seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-parchment-700 px-8 py-3 text-base font-semibold text-parchment-50 transition-colors hover:bg-parchment-800 sm:w-auto">
                Get Started — It&apos;s Free
              </button>
            </SignInButton>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-700"
            >
              See how it works &darr;
            </a>
          </div>
        </div>
      </section>

      {/* Promo Video */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:pb-20">
        <div className="overflow-hidden rounded-xl border border-parchment-200 shadow-lg">
          <video
            className="w-full"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/safereads-promo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-y border-parchment-200 bg-parchment-100/50 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Three ways to find any book
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
            Everything you need to feel confident
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Feature
              icon={<Shield className="h-6 w-6 text-verdict-safe" />}
              title="AI Content Analysis"
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

      {/* Trust / Social Proof */}
      <section className="border-y border-parchment-200 bg-parchment-100/50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Trusted by parents who care
          </h2>
          <p className="mt-4 text-ink-500">
            SafeReads doesn&apos;t tell you what to think. It gives you the
            information you need to make your own decisions about the books your
            children read.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-ink-400">
            <span>AI-powered analysis</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>No bias, just facts</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>Free to use</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-serif text-2xl font-bold text-ink-900 sm:text-3xl">
            Ready to read with confidence?
          </h2>
          <p className="mt-3 text-ink-500">
            Sign up in seconds with your Google account. No credit card needed.
          </p>
          <SignInButton mode="modal">
            <button className="mt-6 rounded-lg bg-parchment-700 px-8 py-3 text-base font-semibold text-parchment-50 transition-colors hover:bg-parchment-800">
              Get Started Free
            </button>
          </SignInButton>
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
