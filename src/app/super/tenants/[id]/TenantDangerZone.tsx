"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmSlugDialog } from "@/features/super-admin/ConfirmSlugDialog";

type DangerOp = "suspend" | "activate" | "expire" | "soft_delete" | "hard_delete" | "transfer";
type Op = DangerOp | "extend_trial";

const DANGER_LABELS: Record<DangerOp, string> = {
  suspend: "Suspend tenant",
  activate: "Activate tenant",
  expire: "Force-expire trial",
  soft_delete: "Soft-delete tenant",
  hard_delete: "Hard-delete tenant",
  transfer: "Transfer ownership",
};

export default function TenantDangerZone({ id, slug, suspended }: { id: string; slug: string; suspended: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Op | null>(null);
  const [pending, setPending] = useState<DangerOp | null>(null);
  const [reason, setReason] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(op: Op) {
    if (op === "extend_trial") {
      if (!window.confirm("Extend trial by 14 days?")) return;
    }
    await submit(op);
  }

  async function submit(op: Op) {
    setLoading(op);
    setError(null);
    try {
      const body: Record<string, unknown> =
        op === "extend_trial"
          ? { op, days: 14 }
          : op === "suspend"
            ? { op, reason: reason.trim() || undefined }
            : op === "soft_delete"
              ? { op, reason: reason.trim() || undefined }
              : op === "hard_delete"
                ? { op, slug }
                : op === "transfer"
                  ? { op, newOwnerEmail: newOwnerEmail.trim() }
                  : { op };
      const res = await fetch(`/api/super/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Failed: ${op}`);
        return;
      }
      setPending(null);
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
        <p className="text-xs text-slate-500">Lifecycle actions. Every action is typed-confirmed, rate-limited, and audited.</p>
      </div>
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason (suspend / soft-delete)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason recorded in the audit trail"
          maxLength={300}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">New owner email (transfer)</span>
        <input
          value={newOwnerEmail}
          onChange={(e) => setNewOwnerEmail(e.target.value)}
          placeholder="owner@example.com (must already belong to this tenant)"
          type="email"
          maxLength={200}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {!suspended ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setPending("suspend")}
            className={`${btn} bg-red-600 hover:bg-red-500 text-white border-red-600`}
          >
            {loading === "suspend" ? "Suspending…" : "Suspend"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setPending("activate")}
            className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600`}
          >
            {loading === "activate" ? "Activating…" : "Activate"}
          </button>
        )}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPending("expire")}
          className={`${btn} bg-white hover:bg-slate-100 text-red-700 border-red-300`}
        >
          {loading === "expire" ? "Expiring…" : "Force Expire Trial"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPending("soft_delete")}
          className={`${btn} bg-white hover:bg-slate-100 text-red-700 border-red-300`}
        >
          {loading === "soft_delete" ? "Soft-deleting…" : "Soft Delete"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => setPending("hard_delete")}
          className={`${btn} bg-red-800 hover:bg-red-900 text-white border-red-800`}
        >
          {loading === "hard_delete" ? "Deleting…" : "Hard Delete"}
        </button>
        <button
          type="button"
          disabled={loading !== null || !newOwnerEmail.trim()}
          onClick={() => setPending("transfer")}
          className={`${btn} bg-white hover:bg-slate-100 text-slate-700 border-slate-300`}
        >
          {loading === "transfer" ? "Transferring…" : "Transfer Ownership"}
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
      {pending && (
        <ConfirmSlugDialog
          expectedSlug={slug}
          actionLabel={DANGER_LABELS[pending]}
          onClose={() => setPending(null)}
          onConfirm={() => submit(pending)}
        />
      )}
    </div>
  );
}
