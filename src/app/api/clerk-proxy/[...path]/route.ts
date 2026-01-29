import { NextRequest, NextResponse } from "next/server";

/**
 * Clerk Frontend API Proxy
 *
 * Proxies requests from /api/clerk-proxy/* to frontend-api.clerk.dev/*
 * Required because Vercel's wildcard DNS intercepts clerk.getsafereads.com
 *
 * Based on Clerk's proxy documentation:
 * https://clerk.com/docs/advanced-usage/using-proxies
 */

// Use our Clerk frontend API domain - the CNAME resolves correctly from Vercel's servers
const CLERK_FRONTEND_API = "https://clerk.getsafereads.com";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = "/" + (path?.join("/") || "");
  const targetUrl = new URL(targetPath, CLERK_FRONTEND_API);

  // Copy search params
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Build headers for Clerk - start with a copy of incoming headers
  const headers = new Headers();

  // Forward all incoming headers first (preserves cookies, auth, etc.)
  req.headers.forEach((value, key) => {
    // Skip host and connection headers - we'll set these ourselves
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Don't override Host - let fetch set it to the target domain
  // Clerk identifies our instance via Clerk-Proxy-Url header

  // Required Clerk proxy headers
  headers.set(
    "Clerk-Proxy-Url",
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "https://getsafereads.com/api/clerk-proxy"
  );
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY || "");

  // Forward client IP for rate limiting
  const forwardedFor =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "";
  if (forwardedFor) {
    headers.set("X-Forwarded-For", forwardedFor);
  }

  // Forward the original host info
  headers.set("X-Forwarded-Host", req.headers.get("host") || "getsafereads.com");
  headers.set("X-Forwarded-Proto", "https");

  // Origin header for CORS
  headers.set("Origin", "https://getsafereads.com");

  try {
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    // Create response with all headers from Clerk
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip hop-by-hop headers
      if (!["connection", "keep-alive", "transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Ensure CORS headers for browser requests
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Clerk proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to proxy request to Clerk", details: errorMessage },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
