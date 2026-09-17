// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";

/**
 * File-handler landing (manifest file_handlers, PDF + images).
 * Inert landing: no DB writes, no auth. Validates that search params are
 * well-formed strings, then redirects to / — the file itself is handled
 * client-side, never trusted here.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  for (const [, value] of searchParams) {
    if (typeof value !== "string" || value.length > 2000) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.redirect(new URL("/", req.url));
}
