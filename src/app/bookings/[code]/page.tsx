// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { TicketCard } from "@/features/booking/TicketCard";

export const dynamic = "force-dynamic";

// Booking tickets carry per-reservation codes and must never be indexed.
export const metadata: Metadata = {
  title: "Your Table Booking",
  robots: { index: false, follow: false },
};

export default async function BookingTicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6}$/.test(code)) notFound();
  const db = createSupabaseAdmin();
  const { data: r } = await db
    .from("table_reservations")
    .select("id, table_ids, name, party_size, starts_at, ends_at, code, status, restaurants(name, slug)")
    .eq("code", code.toUpperCase())
    .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!r) notFound();
  const { data: tables } = await db
    .from("restaurant_tables")
    .select("id, label, qr_token")
    .in("id", r.table_ids.length ? r.table_ids : ["00000000-0000-0000-0000-000000000000"]);
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <TicketCard ticket={{ ...r, table_labels: (tables ?? []).map((t) => t.label), table_qr: (tables ?? [])[0]?.qr_token ?? null }} />
      </div>
    </main>
  );
}
