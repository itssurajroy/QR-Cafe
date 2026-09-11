"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "What hardware do I need?",
    answer:
      "Any phone, tablet, or laptop with a browser works. For KOT/bill printing, a Bluetooth thermal printer (58mm or 80mm). For KDS, a tablet or TV in the kitchen. No expensive POS hardware required.",
  },
  {
    question: "Can I use my existing printer or tablet?",
    answer:
      "Yes. QRslice works with most Bluetooth thermal printers and any device with a web browser. No proprietary hardware needed.",
  },
  {
    question: "What plans are available?",
    answer:
      "One complete plan: ₹999/month per outlet (or ₹9,999/year), with QR ordering, KDS, stock and recipes, full POS, analytics, API access, and priority support. All prices per outlet, GST extra. Every trial is the full system — no feature gates.",
  },
  {
    question: "How does the 14-day free trial work?",
    answer:
      "Every new café gets 14 days of the full system — QR ordering, KDS, stock, POS, everything. No credit card required to start. You'll see a countdown in your admin, and we'll email reminders before it ends.",
  },
  {
    question: "Do I need a credit card for the trial?",
    answer:
      "No. Start with just your email. You only pay when you choose to upgrade to the ₹999/month plan (or ₹9,999/year) after trying everything.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "Ordering pauses until you subscribe, but nothing is deleted — your menu, tables, and history stay safe. Upgrade from the billing page and you're live again instantly.",
  },
  {
    question: "How do customers pay?",
    answer:
      "Cash at counter, UPI QR codes, and online payments via Razorpay. Customers choose their preferred method at checkout.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most cafes are live within 30 minutes. Add your menu items, print the QR codes for each table, and you're ready. No developer or technical knowledge required.",
  },
  {
    question: "Do customers need to download an app?",
    answer:
      "No. Customers scan the QR code with their phone camera and the menu opens directly in their browser. Works on Android, iOS, and any phone with a camera.",
  },
  {
      question: "Can I use QRslice alongside my existing POS?",
    answer:
      "Yes. Many cafes use QRslice for dine-in QR ordering while keeping their existing POS for other operations. They work independently.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data is yours. Export your menu, orders, and customer data anytime. We don't hold your data hostage.",
  },
];

export function FAQ({ items }: { items?: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs =
    items && items.length > 0
      ? items.map((f) => ({ question: f.q, answer: f.a }))
      : FAQS;

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Questions? Answered.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Can&apos;t find what you&apos;re looking for?{" "}
            <a
              href="mailto:support@qrslice.app"
              className="font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 transition-colors hover:text-indigo-700 hover:decoration-indigo-400"
            >
              Contact our support team
            </a>
            .
          </p>
        </div>

        <div className="mt-12 divide-y divide-slate-200 border-t border-slate-200">
          {faqs.map((faq, index) => {
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  id={buttonId}
                  className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-indigo-600"
                  onClick={() => toggle(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={panelId}
                >
                  <span className="text-base font-medium text-slate-900">
                    {faq.question}
                  </span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
                    openIndex === index
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="pb-5 text-sm leading-relaxed text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
