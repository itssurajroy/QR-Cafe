// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";

const MAX_SHARED_LEN = 2000;

function toSafeString(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_SHARED_LEN);
}

/**
 * Web Share Target landing (manifest share_target, POST multipart).
 * Inert landing: no DB writes, no auth. Treats all incoming content as
 * untrusted input — length-capped and passed through as a query param only.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const parts = [toSafeString(form.get("title")), toSafeString(form.get("text")), toSafeString(form.get("url"))]
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const shared = parts.join(" ").slice(0, MAX_SHARED_LEN);

    const dest = new URL("/", req.url);
    if (shared) dest.searchParams.set("shared", shared);
    return NextResponse.redirect(dest);
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
