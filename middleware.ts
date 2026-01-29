import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware(
  // No custom handler - just handle auth cookies
  undefined,
  {
    // Enable verbose logging to debug auth issues
    verbose: true,
    // Persist auth cookie for 30 days (default is session cookie)
    cookieConfig: {
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    },
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
