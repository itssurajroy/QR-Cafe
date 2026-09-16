// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Free Trial — Launch Your Café in 30 Minutes",
  description:
    "Start your 14-day free QRslice trial. Add your menu, print table QR codes and take your first order today. No credit card required.",
  alternates: { canonical: "/onboarding" },
  openGraph: {
    title: "Start Your Free QRslice Trial",
    description:
      "14 days free. Launch QR table ordering, kitchen display and POS billing in about 30 minutes.",
    url: "/onboarding",
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
