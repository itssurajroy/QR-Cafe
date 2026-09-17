// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MessageSquare, Mail, ArrowRight, Sparkles, Smartphone, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Book a Demo & Contact — Talk to QRslice",
  description:
    "Book a personalized 15-minute demo walkthrough of QRslice QR ordering, KDS, and POS register, or get support. Email support@qrslice.com.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Book a Demo & Contact QRslice",
    description:
      "Schedule a 1-on-1 walkthrough demo of QRslice for your restaurant or café.",
    url: "/contact",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Book a Demo & Contact QRslice",
  url: "/contact",
};

export default function ContactPage() {
  const mailtoDemoLink =
    "mailto:support@qrslice.com?subject=Book%20a%20Demo%20Walkthrough%20%E2%80%94%20QRslice&body=" +
    encodeURIComponent(
      "Hi QRslice Team,\n\nI would like to schedule a personalized demo walkthrough of QRslice for my restaurant/café.\n\nRestaurant Name:\nCity / Location:\nOwner/Manager Name:\nPhone / WhatsApp:\nPreferred Date & Time:\n\nThank you!"
    );

  const whatsappDemoLink =
    "https://wa.me/?text=" +
    encodeURIComponent(
      "Hi QRslice Team! I would like to schedule a 1-on-1 demo walkthrough of QRslice for my restaurant."
    );

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
      <main id="main-content" className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/80 border border-violet-200 rounded-full mb-4">
            <Calendar className="w-3.5 h-3.5 text-[#5738F5]" />
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              Personalized Walkthrough
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
            Book a Demo or <br className="hidden sm:block" />
            <span className="text-[#5738F5]">Talk to Our Team</span>
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            See how QRslice replaces paper ticket chaos with a lightning-fast QR menu,
            calm Kitchen Display System (KDS), and Cloud POS.
          </p>
        </div>

        {/* Primary Demo Booking Hero Card */}
        <div id="demo" className="rounded-3xl border-2 border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/40 p-8 sm:p-10 shadow-lg shadow-violet-500/5 mb-10">
          <div className="grid gap-8 lg:grid-cols-5 items-center">
            <div className="lg:col-span-3 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live 15-Minute Screen Share or WhatsApp Walkthrough
              </div>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Schedule a 1-on-1 Product Demo
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Connect directly with our founding engineering and onboarding team. We will walk you through your exact menu setup, thermal printer configuration, and staff PIN system.
              </p>
              <div className="flex flex-wrap gap-y-2 gap-x-6 pt-2 text-xs sm:text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No commitment required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Custom menu preview
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Hardware check (Thermal ESC/POS)
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <a
                href={mailtoDemoLink}
                className="w-full px-5 py-3.5 bg-[#5738F5] hover:bg-[#4828E0] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#5738F5]/20 hover:shadow-lg transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Book Demo via Email</span>
              </a>
              <a
                href={whatsappDemoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Book via WhatsApp</span>
              </a>
              <div className="pt-2 text-center">
                <Link
                  href="/c/table-and-grain"
                  className="text-xs font-semibold text-slate-500 hover:text-[#5738F5] inline-flex items-center gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Or test self-guided demo menu (Table &amp; Grain) →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Contact & Trial Cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href="mailto:support@qrslice.com?subject=QRslice%20Support%20Enquiry"
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-[#5738F5]/40 hover:shadow-md group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-4 group-hover:bg-violet-50 group-hover:text-[#5738F5] transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Customer Support & Technical Help
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Have questions regarding table standees, printers, or custom menu integrations? We reply within one business day.
            </p>
            <span className="mt-4 inline-block font-mono text-sm font-bold text-[#5738F5]">
              support@qrslice.com
            </span>
          </a>

          <Link
            href="/onboarding"
            className="rounded-2xl bg-[#5738F5] p-6 sm:p-8 text-white shadow-lg shadow-[#5738F5]/25 transition-all hover:bg-[#4828E0] group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Prefer to test it yourself?
              </h2>
              <p className="mt-2 text-sm text-violet-100 leading-relaxed">
                Launch your café live in 15 minutes. Upload your menu and generate printable QR standees immediately.
              </p>
            </div>
            <span className="mt-6 flex items-center gap-2 text-sm font-black text-white group-hover:translate-x-1 transition-transform">
              Start 14-Day Free Trial (No Card) <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
