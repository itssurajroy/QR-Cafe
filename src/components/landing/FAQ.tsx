"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "How long does setup take?",
    answer:
      "Most cafés are up and running in under 30 minutes. Simply add your menu, print the QR codes, and you're ready to take orders.",
  },
  {
    question: "Do my customers need to download an app?",
    answer:
      "No. Customers simply scan the QR code with their phone's camera and the menu opens directly in their browser. No app download required.",
  },
  {
    question: "Can I use my existing POS system alongside QR Café?",
    answer:
      "Yes. QR Café works independently or alongside your existing POS. Many owners use it for dine-in QR ordering while keeping their POS for other operations.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support cash at counter, UPI QR codes, and online payments via Razorpay. Customers can pay however they prefer.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Every new café gets a 7-day free trial with full access to all features. No credit card required to start.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Can&apos;t find what you&apos;re looking for? Contact our support
            team.
          </p>
        </div>

        <div className="mt-12 divide-y divide-slate-200 border-t border-slate-200">
          {FAQS.map((faq, index) => (
            <div key={faq.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-left"
                onClick={() => toggle(index)}
              >
                <span className="text-base font-medium text-slate-900">
                  {faq.question}
                </span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="pb-4">
                  <p className="text-sm text-slate-500">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
