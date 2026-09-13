// Copyright (c) 2026 QRslice. All rights reserved.
//
// Seeds the FIRST QRslice super_admin. Runs server-side with the service-role
// key — never import this from client code, never commit real credentials.
//
//   npx tsx scripts/seed_super_admin.ts --email <email> --password <pw>
//
// Preconditions: Task-1 migration applied (audit_events, platform_users),
// NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.
import { createClient } from "@supabase/supabase-js";

const USAGE = `Usage:
  npx tsx scripts/seed_super_admin.ts --email <email> --password <pw>

Creates the first super_admin: auth user + cafe_profiles row
(restaurant_id NULL) + platform_users row. Do NOT run against the
shared DB without the controller's go-ahead.`;

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  return v && !v.startsWith("--") ? v : null;
}

async function main() {
  const email = arg("--email");
  const password = arg("--password");

  if (process.argv.includes("--help") || !email || !password) {
    console.log(USAGE);
    process.exit(!email || !password ? 1 : 0);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Invalid --email value.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Auth user (reuse if the email already exists).
  const { data: listed } = await db.auth.admin.listUsers();
  let userId = listed?.users?.find((u) => u.email === email.toLowerCase().trim())?.id;
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });
    if (error || !data?.user) throw new Error(`createUser failed: ${error?.message}`);
    userId = data.user.id;
    console.log(`Auth user created: ${userId}`);
  } else {
    console.log(`Auth user exists: ${userId}`);
  }

  // 2. cafe_profiles super_admin row (restaurant_id NULL = platform scope).
  const { error: profileErr } = await db.from("cafe_profiles").upsert(
    { id: userId, restaurant_id: null, role: "super_admin", display_name: email, active: true },
    { onConflict: "id" },
  );
  if (profileErr) throw new Error(`cafe_profiles upsert failed: ${profileErr.message}`);
  console.log("cafe_profiles super_admin row upserted (restaurant_id NULL).");

  // 3. platform_users row (Task-1 table — warn, don't fail, if missing live).
  try {
    const { error: puErr } = await db.from("platform_users").upsert(
      { id: userId, email: email.toLowerCase().trim(), full_name: email, role: "super_admin", is_active: true },
      { onConflict: "id" },
    );
    if (puErr) throw puErr;
    console.log("platform_users super_admin row upserted.");
  } catch (e: any) {
    console.warn(`platform_users upsert skipped (Task-1 table may be missing live): ${e?.message ?? e}`);
  }

  // 4. Audit the seeding (best-effort — table may be missing live).
  try {
    const { error: auditErr } = await db.from("audit_events").insert({
      actor_id: userId,
      restaurant_id: null,
      entity: "platform_user",
      entity_id: userId,
      action: "super_seed_first_admin",
      metadata: { email: email.toLowerCase().trim() },
    });
    if (auditErr) throw auditErr;
    console.log("audit_events row inserted (super_seed_first_admin).");
  } catch (e: any) {
    console.warn(`audit_events insert skipped: ${e?.message ?? e}`);
  }

  console.log("\nNext steps:");
  console.log("  1. Sign in at /login with the seeded email + password.");
  console.log("  2. Open /super — the control center requires the super_admin role.");
  console.log("  3. Rotate or delete this one-off password after first login.");
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
