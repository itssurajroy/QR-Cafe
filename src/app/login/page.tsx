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

      // Hard redirect to dashboard
      window.location.href = data.destination || "/admin";
    } catch {
      setError("Network error occurred during login. Please retry.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              ☕
            </div>
            <span className="text-2xl font-black tracking-tight text-white">QR Café</span>
          </Link>
          <p className="text-stone-400 text-sm mt-2">Sign in to your staff or admin terminal</p>
        </div>

        {/* Login Glassmorphism Box */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800/90 rounded-3xl p-8 shadow-2xl space-y-5">
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="admin@qrcafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer mt-2"
            >
              {loading ? "Authenticating…" : "Sign In to Terminal &rarr;"}
            </button>
          </form>

          {/* Back link */}
          <div className="pt-3 border-t border-stone-800/80 text-center">
            <Link href="/" className="text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
