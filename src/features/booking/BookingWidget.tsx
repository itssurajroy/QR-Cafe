"use client";

import { useState } from "react";

export function BookingWidget({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState("2");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, name: name.trim(), phone: phone.trim(),
          party_size: Number(party), starts_at: new Date(`${today}T${time}`).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Booking failed");
        return;
      }
      window.open(`/bookings/${json.code}`, "_blank");
      setName(""); setPhone(""); setTime("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500";
  const label = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">📅 Reserve a Table</h2>
        <p className="text-xs text-slate-500">Same-day booking. Free — pay at the café.</p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Name</label>
          <input required value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={input} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input required type="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={`${input} font-mono`} />
        </div>
        <div>
          <label className={label}>Guests</label>
          <input required type="number" min={1} max={60} value={party} onChange={(e) => setParty(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>Time (today)</label>
          <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </div>
      </form>
      {error && <p className="text-xs text-red-600 font-medium">⚠️ {error}</p>}
      <button type="button" onClick={submit} disabled={busy || !name.trim() || !phone.trim() || !time}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm shadow-md shadow-indigo-600/20 cursor-pointer">
        {busy ? "Reserving…" : "Reserve Table →"}
      </button>
    </section>
  );
}
