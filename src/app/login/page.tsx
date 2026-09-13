"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check credentials.");
        setLoading(false);
        return;
      }

      window.location.href = data.destination || "/admin";
    } catch {
      setError("Network error occurred during login. Please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="landing-page min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-600 selection:text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <img src="/favicon.png" alt="QRslice" className="w-11 h-11 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-black tracking-tight text-slate-900">QRslice</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Sign in to your staff or admin terminal</p>
        </div>

        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-lg space-y-5">
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="admin@qrslice.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-[0.99] cursor-pointer mt-2"
            >
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 text-center">
            <Link href="/" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
