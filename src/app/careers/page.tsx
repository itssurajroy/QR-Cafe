// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Careers | QRslice" },
  description:
    "Join the QRslice team. We are building the next-generation operating system for restaurants, cafés, and hospitality.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <div className="landing-page min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/">
            <QrSliceLogoServer size="md" variant="full" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-500 transition-colors hover:text-slate-800"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-[#5738F5] hover:underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 text-center">
        <span className="inline-block px-3 py-1 bg-[#5738F5]/10 text-[#5738F5] font-bold text-xs uppercase tracking-wider rounded-full mb-4">
          We&apos;re Hiring
        </span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl font-[family-name:var(--font-plus-jakarta)]">
          Build the future of dining with us.
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          QRslice is replacing chaotic hospitality operations with a calm, real-time operating system. We are always looking for passionate builders, engineers, and sales partners.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-lg">Engineering &amp; Product</h3>
            <p className="mt-2 text-sm text-slate-600">
              Next.js, TypeScript, Supabase, real-time WebSockets, and distributed billing systems.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-lg">Growth &amp; Partnerships</h3>
            <p className="mt-2 text-sm text-slate-600">
              Onboarding restaurant &amp; café owners across major metro cities in India.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-lg">Merchant Support</h3>
            <p className="mt-2 text-sm text-slate-600">
              Delighting café managers with 24/7 onboarding, menu digitalization, and operations guidance.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto">
          <h3 className="font-bold text-slate-900 text-xl">Interested in joining?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Send your resume, portfolio, or past work directly to our founders:
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:support@qrslice.com?subject=Careers%20Application%20at%20QRslice"
              className="w-full sm:w-auto px-6 py-3 bg-[#5738F5] hover:bg-[#4628D8] text-white font-bold text-sm rounded-xl transition shadow-xs"
            >
              Email Your Resume
            </a>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 transition"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
