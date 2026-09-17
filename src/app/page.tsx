// Copyright (c) 2026 QRslice. All rights reserved.
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Intro } from "@/components/landing/Intro";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { Testimonials } from "@/components/landing/Testimonials";
import { Statement } from "@/components/landing/Statement";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

import { createFAQSchema, createSoftwareApplicationSchema } from "@/lib/seo";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";

export const metadata: Metadata = {
  title: "QRslice — All-in-One QR Code Restaurant Ordering, POS & Kitchen OS",
  description:
    "Transform your restaurant with QR code table ordering, real-time Kitchen Display System (KDS), counter POS, automated inventory deduction, WhatsApp bills, and instant UPI payments. Zero app download needed for diners.",
  keywords: [
    "QR code table ordering",
    "restaurant ordering system",
    "digital menu QR code",
    "contactless dining software",
    "kitchen display system KDS",
    "restaurant POS software India",
    "kitchen order ticket KOT printer",
    "table ordering system",
    "restaurant billing system",
    "cafe management system",
    "WhatsApp bill restaurant",
    "UPI payment QR menu",
    "self ordering kiosk alternative",
    "restaurant inventory deduction",
    "cloud restaurant POS",
    "table reservation software",
    "restaurant CRM loyalty program",
  ],
  alternates: {
    canonical: "https://qrslice.com",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://qrslice.com",
    title: "QRslice — All-in-One QR Code Restaurant Ordering, POS & Kitchen OS",
    description:
      "Transform your restaurant with QR code table ordering, real-time Kitchen Display System (KDS), counter POS, automated inventory deduction, WhatsApp bills, and instant UPI payments. Zero app download needed.",
    siteName: "QRslice — QR Ordering, Restaurant POS & Kitchen OS",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "QRslice — QR Code Table Ordering & Kitchen OS for Modern Restaurants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QRslice — All-in-One QR Code Restaurant Ordering, POS & Kitchen OS",
    description:
      "Zero app downloads for diners. Real-time KDS, counter POS, instant UPI checkout, and automated inventory. Start your 14-day free trial today.",
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QRslice",
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@qrslice.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QRslice",
    url: APP_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QRslice",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web",
    description:
      "QRslice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
    url: APP_URL,
    featureList: [
      "QR code table ordering with no app download",
      "Kitchen Display System (KDS) with live tickets",
      "Counter POS billing with UPI, card, cash and split bills",
      "Bluetooth thermal printing for kitchen order tickets",
      "Inventory with automatic recipe-based ingredient deduction",
      "Staff roles with 4-digit PIN quick sign-in",
      "Customer loyalty points and CRM",
      "Table reservations with shareable booking tickets",
      "WhatsApp digital bills and receipts",
    ],
    offers: {
      "@type": "Offer",
      price: "999",
      priceCurrency: "INR",
      description: "QRslice complete plan, per outlet per month. Annual option ₹9,999.",
      availability: "https://schema.org/InStock",
      url: `${APP_URL}/pricing`,
    },
  },
  ...createFAQSchema([
    { question: "Do guests need to download an app?", answer: "No. QRslice opens in the guest's browser, so they can scan, browse, and order in seconds without an app or account." },
    { question: "What hardware do I need?", answer: "Any phone, tablet, or laptop with a browser works. Add a Bluetooth thermal printer for KOTs or a tablet / TV for the kitchen display." },
    { question: "Can I use my existing POS?", answer: "Yes. QRslice is designed to sit alongside your current setup, with exports, webhooks, and a flexible API for the workflows you already trust." },
    { question: "How long does setup take?", answer: "Most cafés can go live in around 30 minutes. Import your menu, print table QR codes, and invite your team." },
    { question: "What happens after the free trial?", answer: "You get the full system for 14 days with no credit card required. Continue for ₹999 per month per outlet, or cancel anytime." },
  ]) as any[],
  createSoftwareApplicationSchema() as any,
];

export default async function LandingPage() {
  const { getContent } = await import("@/lib/content");
  const faq = await getContent<{ q: string; a: string }[]>("cms.faq", []);

  return (
    <div className="landing-page min-h-screen font-[family-name:var(--font-plus-jakarta)] bg-[#FAF9F6] text-slate-900 selection:bg-[#5738F5] selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-[#5738F5] focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-[#5738F5]/20"
      >
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* 1. Header */}
      <Navbar />

      <main id="main-content">
        {/* 2. Hero Section with Live Interactive Preview */}
        <Hero />

        {/* 3. Platform Introduction & Animated Stats */}
        <Intro />

        {/* 4. Chaos vs Calm Comparison */}
        <ProblemSolution />

        {/* 5. 3-Step Fast Launch Process */}
        <HowItWorks />

        {/* 6. Modern Bento Grid Features */}
        <Features />

        {/* 7. Interactive ROI & Table Turnover Calculator */}
        <RoiCalculator />

        {/* 8. Testimonials & Social Proof */}
        <Testimonials />

        {/* 9. Brand Statement */}
        <Statement />

        {/* 10. Transparent All-in-One Pricing */}
        <Pricing />

        {/* 11. FAQ with Smooth Accordion */}
        <FAQ items={faq} />

        {/* 12. Final High-Impact CTA */}
        <CTA />
      </main>

      {/* 13. Footer */}
      <Footer />
    </div>
  );
}
