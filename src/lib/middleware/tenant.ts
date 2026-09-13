// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest } from "next/server";
import { tenantCache } from "./cache";

export async function resolveTenant(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const path = url.pathname;
  
  let slug: string | null = null;

  // 1. Path-based resolution (e.g. /c/[slug])
  if (path.startsWith("/c/")) {
    const parts = path.split("/");
    if (parts.length >= 3 && parts[2]) {
      slug = parts[2];
    }
  }

  // 2. Subdomain-based resolution (e.g. [slug].qrslice.app or [slug].localhost:3000)
  // Skip if slug already found via path
  if (!slug) {
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
    const domainParts = hostname.split(".");
    
    // Only resolve subdomain if there is a subdomain part (e.g., tenant.domain.com)
    // If it's just 'localhost:3000' or 'qrslice.app', parts length will be small.
    if (domainParts.length >= 3 || (isLocalhost && domainParts.length >= 2)) {
      const potentialSlug = domainParts[0];
      // Don't treat "www" as a tenant slug
      if (potentialSlug !== "www" && potentialSlug !== "qrslice") {
        slug = potentialSlug;
      }
    }
  }

  if (!slug) return null;

  // 3. Cache lookup
  const cached = tenantCache.get(slug);
  if (cached) return cached;

  // 4. DB fetch if not cached
  // Note: We use the fetch API instead of Supabase client here because middleware 
  // is edge-optimized and we can just hit the Supabase REST API directly, 
  // or we can import the standard server client if Edge-compatible.
  // We'll use the raw fetch to avoid dragging in large dependencies if possible, 
  // or rely on a helper if available. But for robust error handling in Edge, 
  // fetch to Supabase REST is very safe.
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env vars in middleware");
    return null;
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/restaurants?slug=eq.${slug}&select=id,slug,plan,trial_ends_at,subscription_ends_at`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      // Short cache via Next.js fetch cache if we want, but our EdgeCache handles it
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error("Failed to fetch tenant in middleware:", await res.text());
      return null;
    }

    const data = await res.json();
    if (data && data.length > 0) {
      const tenant = data[0];
      tenantCache.set(slug, tenant);
      return tenant;
    }
  } catch (err) {
    console.error("Error resolving tenant in middleware:", err);
  }

  return null;
}

