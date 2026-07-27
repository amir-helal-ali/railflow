/**
 * Next.js API proxy — forwards all /api/* requests to the Rust backend.
 * This allows the frontend to call the backend without CORS issues in production.
 * In development, set BACKEND_URL=http://localhost:8080
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE");
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, "PATCH");
}

async function proxyRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}${path}${searchParams ? `?${searchParams}` : ""}`;

  // Forward headers (especially Authorization)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
      headers.set(key, value);
    }
  });

  // Forward body for non-GET requests
  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      redirect: "manual",
    });

    // Forward response
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseData = await response.arrayBuffer();
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", backend_url: BACKEND_URL },
      { status: 502 }
    );
  }
}
