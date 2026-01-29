import { NextRequest, NextResponse } from "next/server";

const CLERK_FAPI = "https://frontend-api.clerk.services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
) {
  const path = params.path.join("/");
  const url = new URL(request.url);
  const targetUrl = `${CLERK_FAPI}/${path}${url.search}`;

  const headers = new Headers();

  // Forward all request headers
  request.headers.forEach((value, key) => {
    // Skip hop-by-hop headers
    if (!["host", "connection", "keep-alive", "transfer-encoding"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Set Clerk-specific headers for proxy mode
  headers.set("Host", "clerk.getsafereads.com");
  headers.set("Clerk-Proxy-Url", "https://getsafereads.com/api/clerkproxy");
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY || "");
  headers.set("Clerk-Frontend-Api", "clerk.getsafereads.com");
  headers.set("X-Forwarded-Host", "getsafereads.com");
  headers.set("X-Forwarded-Proto", "https");

  // Forward client IP
  const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (forwardedFor) {
    headers.set("X-Forwarded-For", forwardedFor);
  }

  try {
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers();

    // Forward response headers
    response.headers.forEach((value, key) => {
      // Skip hop-by-hop headers and problematic headers
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Ensure CORS headers
    responseHeaders.set("access-control-allow-origin", "https://getsafereads.com");
    responseHeaders.set("access-control-allow-credentials", "true");

    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Clerk proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed", details: String(error) },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "https://getsafereads.com",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization, Cookie, Clerk-Backend-Api-Version",
      "access-control-allow-credentials": "true",
      "access-control-max-age": "86400",
    },
  });
}
