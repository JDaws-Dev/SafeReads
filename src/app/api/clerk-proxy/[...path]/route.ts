import { NextRequest, NextResponse } from "next/server";

const CLERK_FAPI = "https://clerk.getsafereads.com";

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

  // Forward relevant headers
  const forwardHeaders = [
    "content-type",
    "authorization",
    "cookie",
    "user-agent",
    "accept",
    "accept-language",
    "clerk-backend-api-version",
  ];

  for (const header of forwardHeaders) {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  // Set the host header to Clerk's domain
  headers.set("host", "clerk.getsafereads.com");
  headers.set("x-forwarded-host", "clerk.getsafereads.com");
  headers.set("origin", "https://getsafereads.com");

  try {
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers();

    // Forward response headers
    const allowedResponseHeaders = [
      "content-type",
      "set-cookie",
      "cache-control",
      "clerk-backend-api-version",
    ];

    for (const header of allowedResponseHeaders) {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    }

    // Add CORS headers
    responseHeaders.set("access-control-allow-origin", "https://getsafereads.com");
    responseHeaders.set("access-control-allow-credentials", "true");

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Clerk proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed" },
      { status: 502 }
    );
  }
}
