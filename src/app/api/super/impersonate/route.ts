import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.cafeId) {
    return NextResponse.json({ error: "Missing cafeId" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  // Find the owner of this cafe
  const { data: profiles, error: profileErr } = await db
    .from("cafe_profiles")
    .select("id")
    .eq("restaurant_id", body.cafeId)
    .eq("role", "owner")
    .limit(1);

  if (profileErr || !profiles || profiles.length === 0) {
    return NextResponse.json({ error: "Could not find owner for this cafe" }, { status: 404 });
  }

  const ownerId = profiles[0].id;

  // Get owner email
  const { data: user, error: userErr } = await db.auth.admin.getUserById(ownerId);
  if (userErr || !user?.user?.email) {
    return NextResponse.json({ error: "Owner email not found" }, { status: 404 });
  }

  // Generate magic link
  const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: user.user.email,
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkErr?.message || "Failed to generate link" }, { status: 500 });
  }

  // Log audit event
  await db.from("audit_events").insert({
    actor_id: superAdmin.userId,
    restaurant_id: body.cafeId,
    entity: "tenant",
    entity_id: body.cafeId,
    action: "super_impersonate",
    metadata: { owner_email: user.user.email },
  });

  return NextResponse.json({ ok: true, url: linkData.properties.action_link });
}
