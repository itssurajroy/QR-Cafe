// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "FAQ — QR Ordering, Setup, Pricing Questions Answered",
  description:
    "Answers to common QRslice questions: no app downloads for guests, hardware needs, existing POS compatibility, 30-minute setup, trial and ₹999/month pricing.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "QRslice FAQ — Everything Restaurants Ask Us",
    description:
      "Do guests need an app? What hardware? Can I keep my POS? How fast is setup? All answered.",
    url: "/faq",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do guests need to download an app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. QRslice opens in the guest's browser, so they can scan, browse, and order in seconds without an app or account.",
      },
    },
    {
      "@type": "Question",
      name: "What hardware do I need?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Any phone, tablet, or laptop with a browser works. Add a Bluetooth thermal printer for KOTs or a tablet / TV for the kitchen display.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use my existing POS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. QRslice is designed to sit alongside your current setup, with exports, webhooks, and a flexible API for the workflows you already trust.",
      },
    },
    {
      "@type": "Question",
      name: "How long does setup take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most cafés can go live in around 30 minutes. Import your menu, print table QR codes, and invite your team.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after the free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You get the full system for 14 days with no credit card required. Continue for ₹999 per month per outlet, or cancel anytime.",
      },
    },
  ],
};

export default function FaqPage() {
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
      <main id="main-content">
        <div className="mx-auto max-w-4xl px-4 pt-28 sm:px-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Everything restaurants ask before switching to QR table ordering with
            QRslice.
          </p>
        </div>
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
