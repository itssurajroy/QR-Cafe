// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Contact — Talk to the QRslice Team",
  description:
    "Contact QRslice for sales, onboarding help, or support. Email support@qrslice.com — we reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact QRslice",
    description:
      "Sales, onboarding, or support — reach the QRslice team by email.",
    url: "/contact",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact QRslice",
  url: "/contact",
};

export default function ContactPage() {
  return (
    <div className="landing-page min-h-screen font-[family-name:var(--font-plus-jakarta)] bg-[#FAF9F6] text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-[#5738F5] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Talk to a human
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Sales questions, onboarding help, or support — write to us and we
          reply within one business day.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:support@qrslice.com?subject=QRslice%20Enquiry"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#5738F5]/40 hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-slate-900">
              Support
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Orders, billing, or technical issues with your café.
            </p>
            <span className="mt-3 block font-mono text-sm font-bold text-[#5738F5]">
              support@qrslice.com
            </span>
          </a>
          <Link
            href="/onboarding"
            className="rounded-2xl bg-[#5738F5] p-6 text-white shadow-lg shadow-[#5738F5]/25 transition-all hover:bg-[#4828E0]"
          >
            <h2 className="text-lg font-extrabold">Start free trial</h2>
            <p className="mt-1 text-sm text-violet-100">
              Faster than email — launch your café in about 30 minutes.
            </p>
            <span className="mt-3 block text-sm font-black">
              14 days free, no credit card →
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
