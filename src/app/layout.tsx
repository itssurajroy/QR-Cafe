import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://qrcafe.app",
  ),
  title: {
    default: "QR Cafe — QR Menu Ordering & POS for Restaurants",
    template: "%s | QR Cafe",
  },
  description:
    "QR menu ordering, kitchen display, GST invoicing, and POS for Indian cafes. Setup in 30 minutes.",
  keywords: [
    "QR menu",
    "restaurant ordering",
    "cafe POS",
    "kitchen display system",
    "GST invoicing",
    "digital menu",
    "QR code ordering",
    "India restaurant software",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "QR Cafe",
    url: "/",
    title: "QR Cafe — QR Menu Ordering & POS for Restaurants",
    description:
      "QR menu ordering, kitchen display, GST invoicing, and POS for Indian cafes. Setup in 30 minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QR Cafe — QR Menu Ordering & POS for Restaurants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Cafe — QR Menu Ordering & POS for Restaurants",
    description:
      "QR menu ordering, kitchen display, GST invoicing, and POS for Indian cafes. Setup in 30 minutes.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QR Cafe",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-100">
        <ErrorBoundary>
          <ToastProvider>
            <OfflineBanner />
            {children}
            <CookieConsent />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
