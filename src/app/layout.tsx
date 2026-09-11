import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.app",
  ),
  title: {
    default: "QRslice — QR Menu Ordering & POS for Restaurants",
    template: "%s | QRslice",
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
    siteName: "QRslice",
    url: "/",
    title: "QRslice — QR Menu Ordering & POS for Restaurants",
    description:
      "QR menu ordering, kitchen display, GST invoicing, and POS for Indian cafes. Setup in 30 minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QRslice — QR Menu Ordering & POS for Restaurants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QRslice — QR Menu Ordering & POS for Restaurants",
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
    title: "QRslice",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-stone-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <ToastProvider>
              <OfflineBanner />
              {children}
              <CookieConsent />
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
