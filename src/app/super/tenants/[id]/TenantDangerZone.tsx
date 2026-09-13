// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Op = "suspend" | "activate" | "force_expire" | "extend_trial";

export default function TenantDangerZone({ id, suspended }: { id: string; suspended: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Op | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(op: Op) {
    const messages: Record<Op, string> = {
      suspend: "Suspend this tenant? Customers will not be able to order.",
      activate: "Activate this tenant? This clears suspension and sets plan to active.",
      force_expire: "Force-expire this trial? The trial will end immediately.",
      extend_trial: "Extend trial by 14 days?",
    };
    if (!window.confirm(messages[op])) return;
    setLoading(op);
    setError(null);
    try {
      let reason: string | undefined;
      if (op === "suspend") {
        reason = window.prompt("Suspension reason (optional):") ?? undefined;
      }
      const res = await fetch(`/api/super/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op === "extend_trial" ? { op, days: 14 } : { op, reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Failed: ${op}`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  const btn = "px-4 py-2 rounded-xl font-bold text-xs border cursor-pointer disabled:opacity-50 transition-colors";

  return (
    <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-xl space-y-4">
      <div>
        <h2 className="text-sm font-black text-red-700">Danger Zone</h2>
        <p className="text-xs text-slate-500">Lifecycle actions. Every action is audited.</p>
      </div>
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!suspended ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => run("suspend")}
            className={`${btn} bg-red-600 hover:bg-red-500 text-white border-red-600`}
          >
            {loading === "suspend" ? "Suspending…" : "Suspend"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => run("activate")}
            className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600`}
          >
            {loading === "activate" ? "Activating…" : "Activate"}
          </button>
        )}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("force_expire")}
          className={`${btn} bg-white hover:bg-slate-100 text-red-700 border-red-300`}
        >
          {loading === "force_expire" ? "Expiring…" : "Force Expire Trial"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("extend_trial")}
          className={`${btn} bg-white hover:bg-slate-100 text-slate-700 border-slate-300`}
        >
          {loading === "extend_trial" ? "Extending…" : "Extend Trial +14d"}
        </button>
      </div>
    </div>
  );
}
