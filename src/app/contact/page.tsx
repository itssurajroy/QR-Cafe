// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Book a Demo & Contact — Talk to QRslice",
  description:
    "Schedule a 1-on-1 walkthrough of QRslice QR ordering, Kitchen Display System (KDS), and Cloud POS, or get 24/7 restaurant support. WhatsApp +91 85951 01297.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Book a Demo & Contact QRslice",
    description:
      "Schedule a 1-on-1 walkthrough demo of QRslice for your restaurant or café. Live menu demo & printer compatibility test.",
    url: "/contact",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Book a Demo & Contact QRslice",
  url: "https://www.qrslice.com/contact",
  mainEntity: {
    "@type": "Organization",
    name: "QRslice",
    url: "https://www.qrslice.com",
    logo: "https://www.qrslice.com/logo.png",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-85951-01297",
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
        email: "support@qrslice.com",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "09:00",
          closes: "23:00",
        },
      },
    ],
  },
};

export default function ContactPage() {
  return (
    <div className="landing-page min-h-screen font-[family-name:var(--font-plus-jakarta)] bg-[#FAF9F6] text-slate-900 selection:bg-[#5738F5] selection:text-white antialiased">
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
        <ContactClient />
      </main>
      <Footer />
    </div>
  );
}
