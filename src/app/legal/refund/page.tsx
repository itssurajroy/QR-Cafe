// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Refund & Cancellation Policy | QRslice" },
  description:
    "QRslice refund and cancellation policy for SaaS subscriptions, digital payments, and dine-in orders.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 19, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Overview
            </h2>
            <p>
              At QRslice, customer satisfaction, operational transparency, and trust are our highest priorities. This <strong>Refund &amp; Cancellation Policy</strong> explains the terms governing cancellations of software subscriptions, refund eligibility, and fulfillment disclaimers for dine-in orders placed through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Subscription Cancellation Policy (For Café &amp; Restaurant Owners)
            </h2>
            <p>
              We believe in earning your business every single month. There are no long-term lock-ins or hidden penalties:
            </p>
            <ul className="list-disc space-y-2 pl-6 mt-2">
              <li>
                <strong>Self-Service Cancellation Anytime:</strong> Restaurant owners may cancel their paid subscription at any time directly through the QRslice portal under <strong>Admin &gt; Billing &gt; Cancel Subscription</strong> or by sending an email to{" "}
                <a href="mailto:billing@qrslice.com" className="text-[#5738F5] font-semibold hover:underline">
                  billing@qrslice.com
                </a>
                .
              </li>
              <li>
                <strong>Zero Cancellation Fees:</strong> There are no cancellation fees, penalties, or termination charges.
              </li>
              <li>
                <strong>Access Until End of Billing Cycle:</strong> When you cancel your subscription, your account and digital menu will remain fully active until the conclusion of your current paid billing period (monthly or annual). After this date, no further charges will occur, and your store will transition to a paused state.
              </li>
              <li>
                <strong>No Pro-Rated Partial Refunds for Mid-Cycle Cancellation:</strong> Cancellations made mid-cycle do not qualify for partial or pro-rated refunds for unused days within the current billing cycle.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. 7-Day Money-Back Guarantee (New Subscriptions)
            </h2>
            <p>
              For first-time subscribers to QRslice:
            </p>
            <ul className="list-disc space-y-2 pl-6 mt-2">
              <li>
                If you are not completely satisfied with our platform, you are entitled to request a <strong>100% full refund within 7 days</strong> of your initial subscription payment.
              </li>
              <li>
                To claim your 7-day refund, simply email{" "}
                <a href="mailto:billing@qrslice.com" className="text-[#5738F5] font-semibold hover:underline">
                  billing@qrslice.com
                </a>{" "}
                with your registered restaurant name and email address. No questions asked.
              </li>
              <li>
                After 7 days from the initial payment date, payments are non-refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Subscription Renewals
            </h2>
            <p>
              Subscription renewals (monthly or annual) are processed automatically on your billing anniversary via Razorpay. Renewals are non-refundable once charged. To prevent automatic renewal, please initiate your cancellation in your dashboard at least 24 hours prior to your scheduled renewal date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Refund Processing Timelines &amp; Methods
            </h2>
            <ul className="list-disc space-y-2 pl-6 mt-2">
              <li>
                <strong>Approval &amp; Initiation:</strong> Once a refund request is reviewed and approved, our billing team initiates the refund via our payment gateway (Razorpay) within <strong>24 to 48 hours</strong>.
              </li>
              <li>
                <strong>Bank Credit SLA (5 to 7 Business Days):</strong> In compliance with banking standards, refunded amounts are credited directly back to the original payment source (UPI, Credit Card, Debit Card, or Net Banking) within <strong>5 to 7 business days</strong>.
              </li>
              <li>
                <strong>Confirmation Receipt:</strong> A digital refund confirmation receipt and ARN/transaction reference number will be sent to your registered billing email address upon initiation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Dine-In Guest Food Order Cancellations &amp; Refunds
            </h2>
            <p>
              When dining guests scan a table QR code and place an order:
            </p>
            <ul className="list-disc space-y-2 pl-6 mt-2">
              <li>
                <strong>Kitchen Preparation Status:</strong> Once an order is confirmed and sent to the kitchen display (KDS), food preparation begins immediately. Cancellations can only be made <strong>before the kitchen accepts or begins preparing the order</strong>.
              </li>
              <li>
                <strong>On-Premise Settlement:</strong> Food cancellation, dish replacement, or guest refunds are handled directly by the restaurant or café management on premise.
              </li>
              <li>
                <strong>UPI &amp; Digital Payments:</strong> If a customer made an online payment for an order that the café subsequently cancelled or could not fulfill, the restaurant manager can initiate a refund through their POS register, which will return funds to the customer&apos;s source account within 5–7 business days.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Dispute Resolution &amp; Chargebacks
            </h2>
            <p>
              If you notice an unexpected charge or billing discrepancy, we strongly encourage you to contact our billing team at{" "}
              <a href="mailto:billing@qrslice.com" className="text-[#5738F5] font-semibold hover:underline">
                billing@qrslice.com
              </a>{" "}
              or via WhatsApp at +91 85951 01297 before initiating a bank chargeback. We resolve genuine billing discrepancies within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Contact &amp; Escalation
            </h2>
            <p>For refund, cancellation, or invoice inquiries:</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-6 border border-slate-200">
              <p className="font-semibold text-slate-900">QRslice Billing &amp; Merchant Support</p>
              <p className="mt-1 text-slate-600">
                Billing Email:{" "}
                <a href="mailto:billing@qrslice.com" className="text-[#5738F5] font-medium hover:underline">
                  billing@qrslice.com
                </a>
              </p>
              <p className="text-slate-600">
                General Support:{" "}
                <a href="mailto:support@qrslice.com" className="text-[#5738F5] font-medium hover:underline">
                  support@qrslice.com
                </a>
              </p>
              <p className="text-slate-600">
                Grievance Officer:{" "}
                <Link href="/legal/grievance" className="text-[#5738F5] font-medium hover:underline">
                  grievance@qrslice.com
                </Link>
              </p>
              <p className="text-slate-600">
                Helpline &amp; WhatsApp:{" "}
                <a href="tel:+918595101297" className="text-[#5738F5] font-medium hover:underline">
                  +91 85951 01297
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
