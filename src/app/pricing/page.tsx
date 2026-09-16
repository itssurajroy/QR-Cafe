// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Pricing — Simple ₹999/month Restaurant Plan",
  description:
    "One simple plan: ₹999 per outlet per month (₹9,999/year). Unlimited orders, tables, KDS, POS, inventory and 14-day free trial. No credit card required.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "QRslice Pricing — ₹999/month, Everything Included",
    description:
      "Unlimited orders, tables, kitchen display, POS and inventory for ₹999/outlet/month. 14-day free trial, cancel anytime.",
    url: "/pricing",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "QRslice",
  description:
    "QR table ordering, kitchen display system, POS billing and inventory for independent restaurants.",
  brand: { "@type": "Brand", name: "QRslice" },
  offers: {
    "@type": "Offer",
    price: "999",
    priceCurrency: "INR",
    description: "Per outlet per month. Annual option ₹9,999.",
    availability: "https://schema.org/InStock",
  },
};

export default function PricingPage() {
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
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
