import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isClerkProxy = createRouteMatcher(["/__clerk(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Handle Clerk proxy requests
  if (isClerkProxy(req)) {
    return handleClerkProxy(req);
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

function handleClerkProxy(req: NextRequest) {
  const url = new URL(req.url);

  // Remove /__clerk prefix and forward to Clerk's API
  const clerkPath = url.pathname.replace(/^\/__clerk/, "");
  const targetUrl = new URL(`https://clerk.getsafereads.com${clerkPath}${url.search}`);

  // Create headers for the proxy request
  const headers = new Headers(req.headers);
  headers.set("Clerk-Proxy-Url", "https://getsafereads.com/__clerk");
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY || "");
  headers.set("X-Forwarded-Host", "clerk.getsafereads.com");
  headers.set("X-Forwarded-Proto", "https");

  // Forward client IP
  const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (forwardedFor) {
    headers.set("X-Forwarded-For", forwardedFor);
  }

  return NextResponse.rewrite(targetUrl, {
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: [
    // Clerk proxy path
    "/__clerk/(.*)",
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
