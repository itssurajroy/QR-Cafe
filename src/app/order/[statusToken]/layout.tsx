// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";

// Order tracking URLs carry per-order capability tokens and must never be indexed.
export const metadata: Metadata = {
  title: "Track Your Order",
  robots: { index: false, follow: false },
};

export default function OrderStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
