// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { consentCache } from "./cache";

export async function checkConsentAccess(
  request: NextRequest,
  user: { id: string } | null
): Promise<{ allowed: boolean; error?: string }> {
  if (!user) return { allowed: true }; // Unauthenticated routes don't track PII in the same way

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return { allowed: true }; // Fail open if misconfigured

  let consentGiven = consentCache.get(user.id);

  if (consentGiven === null) {
    try {
      // Fetch latest consent log for this user
      const res = await fetch(
        `${supabaseUrl}/rest/v1/dpdp_consent_logs?user_id=eq.${user.id}&order=created_at.desc&limit=1&select=consent_given`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        // If no consent log exists, we assume consent hasn't been explicitly requested yet,
        // or we default to true/false depending on business logic. 
        // For compliance, explicit is better, but to avoid locking out old users, default true if missing.
        consentGiven = data && data.length > 0 ? data[0].consent_given : true; 
        consentCache.set(user.id, consentGiven);
      } else {
        consentGiven = true; // fail open on DB error
      }
    } catch (err) {
      console.error("Middleware consent fetch error:", err);
      consentGiven = true;
    }
  }

  if (!consentGiven) {
    return {
      allowed: false,
      error: "Data processing consent has been withdrawn. Please re-consent to continue using the service.",
    };
  }

  return { allowed: true };
}
