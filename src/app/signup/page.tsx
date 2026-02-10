"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvexAuth, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import PasswordStrengthIndicator from "../../components/PasswordStrengthIndicator";
import { useHaptic } from "../../hooks/useHaptic";

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isPending } = useConvexAuth();
  const { signIn } = useAuthActions();
  const redeemCoupon = useMutation(api.coupons.redeemCoupon);
  const haptic = useHaptic();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    couponCode: "",
  });
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  // Refs for accessibility - focus management on errors
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !isPending) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isPending, router]);

  // Check if entered coupon is a valid lifetime code
  const lifetimeCodes = ["DAWSFRIEND", "DEWITT"];
  const couponTrimmed = formData.couponCode.trim().toUpperCase();
  const isLifetimeCode = lifetimeCodes.includes(couponTrimmed);
  const hasInvalidCode = couponTrimmed.length > 0 && !isLifetimeCode;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // Real-time password mismatch validation
    if (name === "password" || name === "confirmPassword") {
      const password = name === "password" ? value : newFormData.password;
      const confirmPassword = name === "confirmPassword" ? value : newFormData.confirmPassword;
      // Only show mismatch if confirm field has content
      setPasswordMismatch(confirmPassword.length > 0 && password !== confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.light(); // Light tap on submit
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      haptic.error();
      passwordInputRef.current?.focus();
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      haptic.error();
      confirmPasswordInputRef.current?.focus();
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    try {
      // Sign up with Convex Auth (Password provider)
      await signIn("password", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        flow: "signUp",
      });

      // Apply coupon code if provided (after user is created)
      if (formData.couponCode) {
        try {
          await redeemCoupon({ code: formData.couponCode });
        } catch (couponErr) {
          console.warn("[SignupPage] Coupon code failed:", couponErr);
        }
      }

      haptic.success(); // Success feedback
      // Go to onboarding
      router.push("/onboarding");
    } catch (err: unknown) {
      console.error("[SignupPage] Signup error:", err);
      haptic.error(); // Error feedback
      const errorMessage = err instanceof Error ? err.message : "";
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("Account already exists")
      ) {
        setError("This email is already registered. Please log in instead.");
        emailInputRef.current?.focus();
      } else {
        setError("Signup failed. Please try again.");
      }
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    haptic.light(); // Light tap on Google button
    setGoogleLoading(true);
    setError("");

    try {
      await signIn("google", { redirectTo: "/onboarding" });
    } catch (err) {
      console.error("[SignupPage] Google signup error:", err);
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Show loading while checking auth
  if (isPending) {
    return <div className="min-h-screen" />;
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <BookOpen className="h-10 w-10 text-parchment-600" />
            <span className="font-serif text-2xl font-bold text-ink-900">
              SafeReads
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-white p-8 shadow-sm min-w-0">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-bold text-ink-900">
              {isLifetimeCode ? "Get Lifetime Access" : "Start Your Free Trial"}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {isLifetimeCode
                ? "Your code unlocks free access forever!"
                : "7 days free. No credit card required."}
            </p>
          </div>

          {error && (
            <div
              ref={errorRef}
              role="alert"
              aria-live="assertive"
              id="form-error"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="mb-4 flex w-full min-h-[48px] items-center justify-center gap-3 rounded-lg border border-parchment-300 bg-white px-4 py-3 font-medium text-ink-700 transition hover:bg-parchment-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-parchment-300 border-t-parchment-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {googleLoading ? "Creating account..." : "Continue with Google"}
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-parchment-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-ink-400">
                or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-ink-700"
              >
                Your Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full min-h-[44px] rounded-lg border border-parchment-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-parchment-600"
                placeholder="Sarah"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-ink-700"
              >
                Email
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                aria-invalid={error.includes("email") || error.includes("registered") ? true : undefined}
                aria-describedby={error.includes("email") || error.includes("registered") ? "form-error" : undefined}
                className="w-full min-h-[44px] rounded-lg border border-parchment-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-parchment-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-ink-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={error.includes("Password") && error.includes("8") ? true : undefined}
                  aria-describedby={error.includes("Password") && error.includes("8") ? "form-error" : undefined}
                  className="w-full min-h-[44px] rounded-lg border border-parchment-300 px-4 py-3 pr-12 focus:border-transparent focus:ring-2 focus:ring-parchment-600"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-ink-700"
              >
                Confirm Password
              </label>
              <input
                ref={confirmPasswordInputRef}
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={passwordMismatch || error.includes("match") ? true : undefined}
                aria-describedby={passwordMismatch ? "password-mismatch-error" : (error.includes("match") ? "form-error" : undefined)}
                className={`w-full min-h-[44px] rounded-lg border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-parchment-600 ${
                  passwordMismatch
                    ? "border-red-300 bg-red-50"
                    : "border-parchment-300"
                }`}
                placeholder="Confirm your password"
              />
              {passwordMismatch && (
                <p id="password-mismatch-error" role="alert" className="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Promo code section */}
            {!showCouponField ? (
              <button
                type="button"
                onClick={() => setShowCouponField(true)}
                className="text-sm font-medium text-parchment-600 hover:text-parchment-700"
              >
                Have a promo code?
              </button>
            ) : (
              <div>
                <label
                  htmlFor="couponCode"
                  className="mb-1 block text-sm font-medium text-ink-700"
                >
                  Promo Code
                </label>
                <input
                  type="text"
                  id="couponCode"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  className={`w-full min-h-[44px] rounded-lg border px-4 py-3 uppercase focus:ring-2 focus:ring-parchment-600 ${
                    isLifetimeCode
                      ? "border-green-500 bg-green-50"
                      : hasInvalidCode
                        ? "border-red-300 bg-red-50"
                        : "border-parchment-300"
                  }`}
                  placeholder="Enter code"
                />
                {isLifetimeCode && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Lifetime access unlocked!</span>
                  </div>
                )}
                {hasInvalidCode && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">
                      Invalid code - you&apos;ll start with a 7-day trial
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`mt-2 w-full min-h-[48px] rounded-lg px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isLifetimeCode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-parchment-700 hover:bg-parchment-800"
              }`}
            >
              {loading
                ? "Creating Account..."
                : isLifetimeCode
                  ? "Get Lifetime Access"
                  : "Start Free Trial"}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-ink-400">
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Cancel anytime
            </span>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-parchment-600 hover:text-parchment-700"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Bundle Upsell */}
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-900">
                  Want all 3 apps? Save 33%
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Get SafeReads + SafeTunes + SafeTube for just $9.99/mo instead of $14.97
                </p>
                <a
                  href="https://getsafecontent.vercel.app/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Learn about the Safe Suite
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-parchment-100 pt-6">
            <p className="text-center text-xs text-ink-400">
              By signing up, you agree to our{" "}
              <Link
                href="/terms"
                className="text-parchment-600 hover:text-parchment-700"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-parchment-600 hover:text-parchment-700"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
