// Copyright (c) 2026 QRslice. All rights reserved.
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import SuperClient from "@/components/SuperClient";

export const dynamic = "force-dynamic";

export default async function SuperAnnouncementsPage() {
  const user = await requireSuperAdmin();
  if (!user) redirect("/login");
  return <SuperClient cafes={[]} totalCafes={0} page={1} pageSize={15} q="" planFilter="" staff={[]} kpis={{ total: 0, active: 0, trial: 0, suspended: 0, mrr: 0, todayOrders: 0, todayRevenue: 0, trialToPaid: 0, failedPayments: 0, new7dCafes: 0, trialsEnding7d: 0, new7d: 0 }} charts={{ revenue14: [], byPlan: [], topCafes: [] }} config={{}} recentAudit={[]} />;
}
