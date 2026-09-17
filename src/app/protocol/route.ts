// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";

/**
 * Protocol-handler landing (manifest protocol_handlers, web+qrslice).
 * Inert landing: no DB writes, no auth. Validates the q param as an
 * untrusted string (length-capped), then redirects to /.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (q !== null && (typeof q !== "string" || q.length > 2000)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.redirect(new URL("/", req.url));
}
