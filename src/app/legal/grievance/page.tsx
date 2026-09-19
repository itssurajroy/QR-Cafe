// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Grievance Redressal Mechanism | QRslice" },
  description:
    "QRslice statutory grievance redressal officer details and dispute resolution procedure under the Information Technology Act and Consumer Protection Rules.",
  alternates: { canonical: "/legal/grievance" },
};

export default function GrievanceRedressalPage() {
  return (
    <div className="landing-page min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/">
            <QrSliceLogoServer size="md" variant="full" className="h-8 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-800"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-slate-900">Grievance Redressal</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 19, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Statutory Framework
            </h2>
            <p>
              In accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, QRslice has established a dedicated Grievance Redressal Mechanism to address concerns, complaints, or disputes raised by consumers, café partners, or merchants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Designated Grievance Officer
            </h2>
            <p>
              If you have any unresolved concerns regarding data privacy, account security, unauthorized transactions, billing discrepancies, or content hosted on our platform, you may reach out to our designated Grievance Officer:
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-6 border border-slate-200/80 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designation</p>
                  <p className="font-bold text-slate-900 mt-0.5">Grievance Officer</p>
                  <p className="text-slate-600">QRslice Inc.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Official Grievance Email</p>
                  <p className="mt-0.5">
                    <a
                      href="mailto:grievance@qrslice.com"
                      className="font-bold text-[#5738F5] hover:underline"
                    >
                      grievance@qrslice.com
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secondary Contact &amp; WhatsApp</p>
                  <p className="mt-0.5">
                    <a
                      href="tel:+918595101297"
                      className="font-bold text-slate-800 hover:underline"
                    >
                      +91 85951 01297
                    </a>
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Mon–Sat, 10:00 AM – 7:00 PM IST</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Office Location</p>
                  <p className="font-medium text-slate-800 mt-0.5">New Delhi, India</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Grievance Redressal Process &amp; SLAs
            </h2>
            <ol className="list-decimal pl-6 space-y-3 mt-2">
              <li>
                <strong>Filing a Complaint:</strong> Send an email to{" "}
                <a href="mailto:grievance@qrslice.com" className="text-[#5738F5] font-semibold hover:underline">
                  grievance@qrslice.com
                </a>{" "}
                with a detailed description of your issue, your registered phone number/email, relevant order ID or transaction reference (e.g., Razorpay payment ID), and any supporting screenshots.
              </li>
              <li>
                <strong>Acknowledgment SLA (48 Hours):</strong> Our Grievance Office will acknowledge receipt of your complaint within <strong>48 hours</strong> of receipt and assign a unique Ticket/Reference ID.
              </li>
              <li>
                <strong>Investigation &amp; Resolution SLA (15 to 30 Days):</strong> Every grievance will be investigated and resolved expeditiously, and in no event later than <strong>30 days</strong> (with a standard internal target of <strong>15 business days</strong>) from the date of initial receipt.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Escalation Levels
            </h2>
            <div className="space-y-4 mt-2">
              <div className="border-l-2 border-[#5738F5] pl-4">
                <p className="font-semibold text-slate-900">Level 1: General Customer &amp; Partner Support</p>
                <p className="text-sm text-slate-600">
                  First contact our general support desk at{" "}
                  <a href="mailto:support@qrslice.com" className="text-[#5738F5] hover:underline">
                    support@qrslice.com
                  </a>{" "}
                  or via WhatsApp at +91 85951 01297 for quick operational assistance, menu configuration, or billing queries.
                </p>
              </div>
              <div className="border-l-2 border-amber-500 pl-4">
                <p className="font-semibold text-slate-900">Level 2: Grievance Officer Escalation</p>
                <p className="text-sm text-slate-600">
                  If your issue remains unresolved after 5 business days or if you are dissatisfied with the response from Level 1, escalate directly to the Grievance Officer at{" "}
                  <a href="mailto:grievance@qrslice.com" className="text-[#5738F5] hover:underline">
                    grievance@qrslice.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Related Legal Policies
            </h2>
            <p>
              For further details regarding user rights, cancellation procedures, and data handling, please refer to our related policies:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
              <li>
                <Link href="/legal/terms" className="text-[#5738F5] hover:underline font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-[#5738F5] hover:underline font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="text-[#5738F5] hover:underline font-medium">
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/shipping-delivery" className="text-[#5738F5] hover:underline font-medium">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#5738F5] hover:underline font-medium">
                  Contact Us
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
