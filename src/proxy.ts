import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Derive the café subdomain from the host and forward it as a request header
// so Server Components can scope data without re-parsing the host.
//   curry-leaf.localhost -> x-cafe-slug: curry-leaf
//   localhost            -> x-cafe-slug: (apex / super-admin console)
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  let slug = "";
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    const parts = hostname.split(".");
    if (parts.length >= 3) slug = parts[0];
    else if (parts.length === 2 && parts[1] === "localhost") slug = parts[0];
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cafe-slug", slug);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Run on all page routes; skip API, static assets, and metadata files.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
