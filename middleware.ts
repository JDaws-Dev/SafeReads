import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// Temporarily disabled route protection to debug auth loop
// TODO: Re-enable once auth cookies are working properly
export default convexAuthNextjsMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
