// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";
import Link from "next/link";
import { QrSliceLogoServer } from "@/components/brand/QrSliceLogoServer";

export const metadata: Metadata = {
  title: { absolute: "Shipping & Delivery Policy | QRslice" },
  description:
    "QRslice shipping and delivery policy for digital SaaS provisioning, physical QR standees, and restaurant fulfillment disclaimers.",
  alternates: { canonical: "/legal/shipping-delivery" },
};

export default function ShippingDeliveryPage() {
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
        <h1 className="text-3xl font-bold text-slate-900">Shipping &amp; Delivery Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 19, 2026
        </p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Nature of Our Services
            </h2>
            <p>
              QRslice operates primarily as a Software-as-a-Service (SaaS) platform providing digital QR ordering, kitchen display systems (KDS), cloud point-of-sale (POS), billing, and customer relationship management tools for restaurants, cafés, and hospitality businesses.
            </p>
            <p className="mt-2">
              Our fulfillment model covers both <strong>instant electronic service activation</strong> for software subscriptions and <strong>physical merchandise delivery</strong> for printed QR standees and table tent cards where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Digital Software Delivery &amp; Instant Provisioning
            </h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Instant Access:</strong> Upon completing registration or subscribing to a paid QRslice plan via our payment gateway (Razorpay), your restaurant workspace, POS access, and digital menu are activated instantly.
              </li>
              <li>
                <strong>Electronic Confirmation:</strong> Account credentials, tax invoice, and workspace links are delivered immediately to your registered email address and phone number upon successful checkout.
              </li>
              <li>
                <strong>No Shipping Fee:</strong> Digital SaaS subscriptions, software updates, cloud hosting, and printable PDF downloads carry zero delivery or shipping fees.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Physical Goods Delivery (QR Standees &amp; Table Tent Cards)
            </h2>
            <p>
              While restaurant owners can download high-resolution, print-ready PDF QR tent cards directly from their dashboard at zero cost, QRslice also offers optional physical acrylic standees and custom-printed QR merchandise upon request:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Dispatch Timeline:</strong> Physical QR standees and merchandise orders are processed, manufactured, and handed over to logistics partners within <strong>2 to 3 business days</strong> of order confirmation.
              </li>
              <li>
                <strong>Delivery Timeframe:</strong> Orders are delivered within <strong>3 to 5 business days</strong> across major metro cities in India, and <strong>5 to 7 business days</strong> for non-metro/regional locations.
              </li>
              <li>
                <strong>Shipping Partners:</strong> We partner with trusted courier services across India (e.g., Blue Dart, Delhivery, DTDC, or India Post) to ensure safe and timely delivery.
              </li>
              <li>
                <strong>Tracking Information:</strong> Once dispatched, a consignment tracking number and live status link are shared via email and WhatsApp.
              </li>
              <li>
                <strong>Shipping Charges:</strong> Any applicable shipping or handling charges for physical standees are clearly displayed at checkout prior to payment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Damaged or Defective Physical Items
            </h2>
            <p>
              If your physical QR standees or merchandise arrive damaged, misprinted, or defective, please notify us within <strong>48 hours</strong> of delivery with clear photographs of the package and item at{" "}
              <a href="mailto:support@qrslice.com" className="text-[#5738F5] font-semibold hover:underline">
                support@qrslice.com
              </a>{" "}
              or via WhatsApp at{" "}
              <a href="tel:+918595101297" className="text-[#5738F5] font-semibold hover:underline">
                +91 85951 01297
              </a>
              . We will arrange a free replacement at no additional cost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Restaurant Food Preparation &amp; On-Premise Fulfillment Disclaimer
            </h2>
            <p>
              QRslice is a technology infrastructure provider. When diners scan a QR code at a participating dining establishment and place a food or beverage order:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                All food preparation, culinary quality, ingredient hygiene, packaging, and table delivery are handled <strong>exclusively and directly by the independent restaurant or café</strong> where the order was placed.
              </li>
              <li>
                QRslice does not operate delivery fleets, prepare food, or employ restaurant kitchen staff. Inquiries regarding on-table food delivery timing or missing dishes should be directed immediately to the restaurant floor manager or staff.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Contact Us
            </h2>
            <p>
              For any questions or support regarding digital provisioning, physical standee dispatch, or tracking:
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-6 border border-slate-200">
              <p className="font-semibold text-slate-900">QRslice Logistics &amp; Support</p>
              <p className="mt-1 text-slate-600">
                Email:{" "}
                <a href="mailto:support@qrslice.com" className="text-[#5738F5] font-medium hover:underline">
                  support@qrslice.com
                </a>
              </p>
              <p className="text-slate-600">
                WhatsApp &amp; Phone:{" "}
                <a href="tel:+918595101297" className="text-[#5738F5] font-medium hover:underline">
                  +91 85951 01297
                </a>
              </p>
              <p className="text-slate-600">
                Hours: Monday – Saturday, 10:00 AM – 7:00 PM IST
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
