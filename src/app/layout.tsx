import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
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

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.app",
  ),
  title: {
    default: "QrSlice — QR Ordering & Kitchen OS for Restaurants",
    template: "%s | QrSlice",
  },
  description:
    "QrSlice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
  keywords: [
    "QR ordering",
    "restaurant ordering",
    "kitchen display system",
    "digital menu",
    "table ordering",
    "restaurant POS",
    "cafe management",
    "QR code ordering",
    "kitchen OS",
    "restaurant technology",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "QrSlice",
    url: "/",
    title: "QrSlice — QR Ordering & Kitchen OS for Restaurants",
    description:
      "QrSlice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QrSlice — QR Ordering & Kitchen OS for Restaurants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QrSlice — QR Ordering & Kitchen OS for Restaurants",
    description:
      "QrSlice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
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
    title: "QrSlice",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5738F5",
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
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-stone-950 text-[#17142B] dark:text-stone-100 transition-colors duration-300">
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
