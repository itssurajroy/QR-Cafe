// Copyright (c) 2026 QRslice. All rights reserved.
import type { Metadata } from "next";

// Digital receipts contain per-order data and must never be indexed.
export const metadata: Metadata = {
  title: "Your Receipt",
  robots: { index: false, follow: false },
};

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
