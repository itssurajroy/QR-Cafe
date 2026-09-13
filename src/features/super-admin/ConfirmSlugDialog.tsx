// Copyright (c) 2026 QRslice. All rights reserved.
"use client";
import { useState } from "react";

export function ConfirmSlugDialog({ expectedSlug, actionLabel, onConfirm, onClose }: {
  expectedSlug: string; actionLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = typed.trim() === expectedSlug;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-slate-900">{actionLabel}</h3>
        <p className="text-xs text-slate-600">Type <code className="font-mono font-bold">{expectedSlug}</code> to confirm. This is audited.</p>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={expectedSlug} className="w-full border rounded-xl px-3 py-2 text-sm font-mono" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-100 text-sm font-bold">Cancel</button>
          <button type="button" disabled={!ok} onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-40">Confirm</button>
        </div>
      </div>
    </div>
  );
}
