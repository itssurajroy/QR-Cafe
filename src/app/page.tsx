// Copyright (c) 2026 QRslice. All rights reserved.
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Intro } from "@/components/landing/Intro";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Statement } from "@/components/landing/Statement";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.app";

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QRslice",
    url: APP_URL,
    logo: `${APP_URL}/favicon.png`,
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
    operatingSystem: "Web",
    description:
      "QRslice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
    url: APP_URL,
    offers: {
      "@type": "Offer",
      price: "999",
      priceCurrency: "INR",
      description: "QRslice complete plan, per outlet per month. Annual option ₹9,999.",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do guests need to download an app?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. QRslice opens in the guest’s browser, so they can scan, browse, and order in seconds without an app or account.",
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
  },
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
        {/* 2. Hero Section */}
        <Hero />
        
        {/* 3. Platform Introduction */}
        <Intro />
        
        {/* 4. Features Grid */}
        <Features />
        
        {/* 5. How It Works */}
        <HowItWorks />
        
        {/* 6. Testimonials */}
        <Testimonials />

        {/* 7. Statement */}
        <Statement />
        
        {/* 8. Pricing */}
        <Pricing />
        
        {/* 9. FAQ */}
        <FAQ items={faq} />
        
        {/* 10. Final CTA */}
        <CTA />
      </main>
      
      {/* 11. Footer */}
      <Footer />
    </div>
  );
}
