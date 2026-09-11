import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PlatformConfigForm, FlagsManager } from "./PlatformForms";

export const dynamic = "force-dynamic";

export default async function SuperPlatformPage() {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/login");
  }

  const db = createSupabaseAdmin();
  const [{ data: configRows }, { data: flagRows }] = await Promise.all([
    db.from("platform_config").select("key, value"),
    db.from("feature_flags").select("key, enabled, description, updated_at").order("key", { ascending: true }),
  ]);

  const config: Record<string, any> = {};
  for (const row of configRows ?? []) {
    config[row.key] = (row as { value: any }).value;
  }

  const trialDays = Number(config.trial_days?.days) || 14;
  const prices = config.prices && typeof config.prices === "object" ? config.prices : {};
  const monthly = Number(prices.monthly ?? prices.pro ?? 999) || 0;
  const yearly = Number(prices.yearly ?? 9999) || 0;
  const maintenance = config.maintenance_mode?.enabled === true;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black">Platform Settings</h1>
            <p className="text-xs text-slate-500">Trial defaults, pricing, maintenance, and feature flags.</p>
          </div>
          <Link href="/super" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
            ← Back to console
          </Link>
        </div>

        <PlatformConfigForm
          initialTrialDays={trialDays}
          initialMonthly={monthly}
          initialYearly={yearly}
          initialMaintenance={maintenance}
        />

        <FlagsManager initialFlags={(flagRows ?? []) as any} />
      </div>
    </main>
  );
}
