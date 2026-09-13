// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Refund Policy | QRslice" },
  description:
    "QRslice refund policy for subscriptions and payments.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPolicyPage() {
  return (
    <div className="landing-page min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/"><img src="/logo.png" alt="QRslice" className="h-8 w-auto" /></Link>
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-800"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">Refund Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 9, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Overview
            </h2>
            <p>
              At QRslice, we want you to be satisfied with our service. This
              Refund Policy explains when and how you can request a refund for
              payments made through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. New Subscriptions
            </h2>
            <p>
              QRslice offers paid subscription plans. If you are not satisfied,
              you may request a full refund within <strong>7 days</strong> of
              your initial subscription date. After 7 days, refunds are not
              available for the current billing period.
            </p>

            <h3 className="text-lg font-medium text-slate-800">
              2.1 Renewals
            </h3>
            <p>
              Subscription renewals are non-refundable. If you do not wish to
              continue, please cancel your subscription before the renewal date
              to avoid future charges.
            </p>

            <h3 className="text-lg font-medium text-slate-800">
              2.2 Mid-Cycle Cancellation
            </h3>
            <p>
              If you cancel a paid subscription mid-cycle, your access continues
              until the end of the current billing period. No partial refunds
              are issued for unused time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. How to Request a Refund
            </h2>
            <p>To request a refund, contact us at:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Email:{" "}
                <a
                  href="mailto:billing@qrslice.com"
                  className="text-indigo-600 hover:underline"
                >
                  billing@qrslice.com
                </a>
              </li>
              <li>
                Subject line: &quot;Refund Request — [Your Account Email]&quot;
              </li>
            </ul>
            <p>Please include:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Your account email address</li>
              <li>Date of the charge</li>
              <li>Reason for the refund request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Processing Refunds
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Approved refunds are processed within <strong>5-7 business
                days</strong>.
              </li>
              <li>
                Refunds are credited to the original payment method via Razorpay.
              </li>
              <li>
                Depending on your bank, it may take an additional 5-10 business
                days for the refund to appear in your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Exceptions
            </h2>
            <p>Refunds may not be available in the following cases:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Requests made more than 7 days after the initial subscription.</li>
              <li>Subscriptions cancelled after the renewal date.</li>
              <li>
                Accounts terminated due to violation of our{" "}
                <Link href="/legal/terms" className="text-indigo-600 hover:underline">
                  Terms and Conditions
                </Link>
                .
              </li>
              <li>
                Charges resulting from unauthorized use due to your failure to
                secure your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Chargebacks
            </h2>
            <p>
              If you initiate a chargeback without first contacting us, we may
              temporarily suspend your account while the dispute is investigated.
              We encourage you to reach out to us first so we can resolve the
              issue quickly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this Refund Policy from time to time. Changes will
              be posted on this page with an updated &quot;Last updated&quot;
              date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">              8. Contact</h2>
            <p>For refund-related questions:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Email:{" "}
                <a
                  href="mailto:billing@qrslice.com"
                  className="text-indigo-600 hover:underline"
                >
                  billing@qrslice.com
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:support@qrslice.com"
                  className="text-indigo-600 hover:underline"
                >
                  support@qrslice.com
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

