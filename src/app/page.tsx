import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DemoPitch } from "@/components/landing/DemoPitch";
import { Pricing } from "@/components/landing/Pricing";
import { Differentiation } from "@/components/landing/Differentiation";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrcafe.app";

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QR Cafe",
    url: APP_URL,
    logo: `${APP_URL}/icon-512.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@qrcafe.app",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QR Cafe",
    url: APP_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QR Cafe",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "QR menu ordering, kitchen display, GST invoicing, and POS for Indian cafes.",
    url: APP_URL,
    offers: {
      "@type": "Offer",
      price: "999",
      priceCurrency: "INR",
      description: "QR Café single plan, per outlet per month. Annual option ₹9,999.",
    },

  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What hardware do I need?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Any phone, tablet, or laptop with a browser works. For KOT/bill printing, a Bluetooth thermal printer (58mm or 80mm). For KDS, a tablet or TV in the kitchen. No expensive POS hardware required.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use my existing printer or tablet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. QR Cafe works with most Bluetooth thermal printers and any device with a web browser. No proprietary hardware needed.",
        },
      },
      {
        "@type": "Question",
        name: "What plans are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "One complete plan: ₹999/month per outlet (or ₹9,999/year), with QR ordering, KDS, stock and recipes, full POS, analytics, API access, and priority support. All prices per outlet, GST extra.",
        },
      },
      {
        "@type": "Question",
        name: "How do customers pay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cash at counter, UPI QR codes, and online payments via Razorpay. Customers choose their preferred method at checkout.",
        },
      },
      {
        "@type": "Question",
        name: "How long does setup take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most cafes are live within 30 minutes. Add your menu items, print the QR codes for each table, and you're ready. No developer or technical knowledge required.",
        },
      },
      {
        "@type": "Question",
        name: "Do customers need to download an app?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Customers scan the QR code with their phone camera and the menu opens directly in their browser. Works on Android, iOS, and any phone with a camera.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use QR Cafe alongside my existing POS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Many cafes use QR Cafe for dine-in QR ordering while keeping their existing POS for other operations. They work independently.",
        },
      },
      {
        "@type": "Question",
        name: "What happens to my data if I cancel?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your data is yours. Export your menu, orders, and customer data anytime. We don't hold your data hostage.",
        },
      },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-indigo-300"
      >
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar />
      <main id="main-content">
        <Hero />
        <TrustBar />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <DemoPitch />
        <Pricing />
        <Differentiation />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
