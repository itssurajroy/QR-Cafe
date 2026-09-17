// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Printer,
  ChefHat,
  Send,
  Copy,
  Check,
  HelpCircle,
} from "lucide-react";

const WHATSAPP_NUMBER = "918595101297";
const WHATSAPP_DISPLAY = "+91 85951 01297";
const SUPPORT_EMAIL = "support@qrslice.com";

interface FormState {
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  city: string;
  outlets: string;
  inquiryType: "demo" | "support" | "hardware" | "enterprise" | "general";
  preferredSlot: string;
  message: string;
}

export function ContactClient() {
  const [tab, setTab] = useState<"demo" | "support">("demo");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    restaurantName: "",
    city: "",
    outlets: "1 Outlet",
    inquiryType: "demo",
    preferredSlot: "Today (Next Available)",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          inquiryType: tab === "demo" ? "demo" : "support",
        }),
      });

      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        setError(data.error || "Failed to submit request. Please reach out via WhatsApp.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("Network error occurred. You can still message us directly on WhatsApp!");
      setLoading(false);
    }
  }

  const prefilledWhatsAppText = encodeURIComponent(
    tab === "demo"
      ? `Hi QRslice Team! I'd like to schedule a 1-on-1 demo for my restaurant.\n\nName: ${form.name || "Owner"}\nRestaurant: ${form.restaurantName || "My Restaurant"}\nCity: ${form.city || "India"}\nPhone: ${form.phone || ""}`
      : `Hi QRslice Team, I need assistance regarding QRslice.\n\nName: ${form.name || ""}\nRestaurant: ${form.restaurantName || ""}\nMessage: ${form.message || ""}`
  );

  const directWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${prefilledWhatsAppText}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
      {/* Top Title & Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100/80 border border-violet-200/90 rounded-full mb-4 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#5738F5] animate-pulse" />
          <span className="text-xs font-black text-[#5738F5] uppercase tracking-wider">
            Direct Founder &amp; Engineering Onboarding
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
          Book a 1-on-1 Demo or <br className="hidden sm:block" />
          <span className="text-[#5738F5]">Talk to Our Team</span>
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg max-w-2xl mx-auto leading-relaxed">
          See how QRslice replaces paper ticket chaos with lightning-fast contactless QR ordering,
          calm Kitchen Display System (KDS), and cloud billing.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        {/* Left Column: Value Proposition & Direct Contact Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Direct Contacts Pill Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5738F5]" />
              Immediate Response Channels
            </h2>

            <div className="space-y-3">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-700">Instant Chat &amp; Demo</div>
                    <div className="text-sm font-black">{WHATSAPP_DISPLAY}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500">Official Inquiries &amp; PDF Menus</div>
                    <div className="text-sm font-bold font-mono">{SUPPORT_EMAIL}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
                  title="Copy email"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-medium">Support Hours: Mon – Sun, 9:00 AM – 11:00 PM IST</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Now
                </span>
              </div>
            </div>
          </div>

          {/* What happens on the demo */}
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-violet-50/70 via-white to-amber-50/30 p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#5738F5]" />
              What to expect in your 15-minute demo:
            </h3>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-[#5738F5] shrink-0 mt-0.5" />
                <span>
                  <strong>Live Phone Experience:</strong> We send you a live test QR table so you can experience ordering and add-ons directly on your mobile device.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <ChefHat className="w-4 h-4 text-[#5738F5] shrink-0 mt-0.5" />
                <span>
                  <strong>Kitchen Display (KDS):</strong> See incoming orders ring instantly with voice alerts and priority timers.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Printer className="w-4 h-4 text-[#5738F5] shrink-0 mt-0.5" />
                <span>
                  <strong>Hardware Check:</strong> Verify compatibility with your existing thermal receipt printers (ESC/POS 58mm/80mm USB, LAN, or Bluetooth).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Free Menu Digitization:</strong> Share your food menu PDF or photo, and our team will convert it into high-resolution categories and modifiers for free.
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/c/table-and-grain"
                target="_blank"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#5738F5] hover:underline"
              >
                <span>Or explore interactive demo café (Table &amp; Grain) right now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg shadow-violet-500/5 relative overflow-hidden">
            {/* Tab switch */}
            <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/90 mb-6">
              <button
                type="button"
                onClick={() => setTab("demo")}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tab === "demo"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4 text-[#5738F5]" />
                Book 1-on-1 Demo
              </button>
              <button
                type="button"
                onClick={() => setTab("support")}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tab === "support"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Support &amp; Inquiries
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Request Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{form.name || "Friend"}</strong>! Our onboarding specialist will contact you on <strong>{form.phone || form.email}</strong> shortly.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Chat on WhatsApp Now &rarr;
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: "",
                        email: "",
                        phone: "",
                        restaurantName: "",
                        city: "",
                        outlets: "1 Outlet",
                        inquiryType: "demo",
                        preferredSlot: "Today",
                        message: "",
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Suraj Roy"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@mycafe.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Restaurant / Café Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Curry Leaf Bistro"
                      value={form.restaurantName}
                      onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Bengaluru, Mumbai"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Number of Outlets
                    </label>
                    <select
                      value={form.outlets}
                      onChange={(e) => setForm({ ...form, outlets: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all bg-white"
                    >
                      <option value="1 Outlet">Single Outlet</option>
                      <option value="2-5 Outlets">2 to 5 Outlets</option>
                      <option value="6+ Outlets / Franchise">6+ Outlets / Franchise</option>
                      <option value="Opening Soon">Opening Soon (New Venture)</option>
                    </select>
                  </div>
                </div>

                {tab === "demo" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Preferred Demo Time
                    </label>
                    <select
                      value={form.preferredSlot}
                      onChange={(e) => setForm({ ...form, preferredSlot: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all bg-white"
                    >
                      <option value="Today (Next Available)">Today (Next Available Specialist)</option>
                      <option value="Tomorrow Morning (10 AM - 1 PM)">Tomorrow Morning (10 AM - 1 PM IST)</option>
                      <option value="Tomorrow Afternoon (2 PM - 5 PM)">Tomorrow Afternoon (2 PM - 5 PM IST)</option>
                      <option value="Tomorrow Evening (5 PM - 8 PM)">Tomorrow Evening (5 PM - 8 PM IST)</option>
                      <option value="Weekend Slot">Weekend Slot</option>
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {tab === "demo" ? "Additional Notes (Optional)" : "How can we help? (Optional)"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      tab === "demo"
                        ? "Tell us about your current setup, POS, or printer model..."
                        : "Describe your inquiry or question in detail..."
                    }
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 text-sm outline-none transition-all resize-none"
                  />
                </div>

                {error ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#5738F5] hover:bg-[#4828E0] text-white font-black text-sm transition-all shadow-md shadow-[#5738F5]/25 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{tab === "demo" ? "Confirm & Book Live Demo" : "Submit Enquiry"}</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400">
                  🔒 No credit card required. No spam. 100% confidential.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Onboarding FAQ Accordion/Cards */}
      <div className="border-t border-slate-200/80 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything you need to know before booking your walkthrough.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5738F5]" />
              How long does onboarding take?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Most cafés go live in under 15 minutes. Send us your existing PDF or photo menu, and our team digitizes all items, modifiers, and prices for you at no extra cost.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#5738F5]" />
              Do I need proprietary hardware?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Zero proprietary hardware. QRslice runs on any smartphone, iPad, Android tablet, or laptop. It connects natively to any standard 58mm/80mm ESC/POS thermal printer via USB, Bluetooth, or LAN.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Can I test it before paying?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Yes! You get a full 14-day free trial with unlimited orders, printable QR standee designer, and kitchen KDS screens. No credit card is required to sign up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
