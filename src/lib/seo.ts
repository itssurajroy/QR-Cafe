// Copyright (c) 2026 QRslice. All rights reserved.

import type { Metadata } from "next";

export type RestaurantSeoInput = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  google_review_url?: string | null;
  upi_qr_url?: string | null;
};

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";
export const SITE_NAME = "QRslice";
export const SITE_NAME_FULL = "QRslice — QR Ordering & Kitchen OS";

export function getCanonicalUrl(path: string): string {
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export function getSiteUrl(): string {
  return SITE_URL;
}

export function createPageMetadata({
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
  noFollow = false,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  noIndex?: boolean;
  noFollow?: boolean;
}): Metadata {
  const ogImageUrl = ogImage || "/og-image.png";

  return {
    title: {
      default: `${SITE_NAME} — ${title}`,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    alternates: {
      canonical: getCanonicalUrl(path),
    },
    openGraph: {
      type: ogType,
      locale: "en_IN",
      url: getCanonicalUrl(path),
      title: `${SITE_NAME} — ${title}`,
      description,
      siteName: SITE_NAME_FULL,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl.startsWith("http") ? ogImageUrl : `${SITE_URL}${ogImageUrl}`,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
    },
    twitter: {
      card: twitterCard,
      title: `${SITE_NAME} — ${title}`,
      description,
      images: ogImageUrl
        ? [ogImageUrl.startsWith("http") ? ogImageUrl : `${SITE_URL}${ogImageUrl}`]
        : [`${SITE_URL}/og-image.png`],
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
    },
  };
}

export function createRestaurantMetadata({
  restaurant,
  path,
}: {
  restaurant: RestaurantSeoInput;
  path: string;
}): Metadata {
  const description = `Browse the fresh culinary menu and place contactless table orders at ${restaurant.name}. Prepared fresh, delivered right to your table.`;

  return {
    title: `${restaurant.name} — Digital Menu & Contactless Table Ordering`,
    description,
    alternates: {
      canonical: getCanonicalUrl(path),
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: getCanonicalUrl(path),
      title: `${restaurant.name} | Digital Menu & Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone at ${restaurant.name}.`,
      images: restaurant.logo_url ? [restaurant.logo_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${restaurant.name} | Digital Menu & Table Ordering`,
      description: `Browse dishes, customize your order, and pay seamlessly from your phone at ${restaurant.name}.`,
      images: restaurant.logo_url ? [restaurant.logo_url] : [],
    },
  };
}

export function createRestaurantSchema(
  restaurant: RestaurantSeoInput
): object {
  const baseUrl = SITE_URL;
  const url = `${baseUrl}/c/${restaurant.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${baseUrl}/c/${restaurant.slug}#restaurant`,
    name: restaurant.name,
    description: restaurant.description || `Browse the fresh culinary menu and place contactless table orders at ${restaurant.name}.`,
    url,
    telephone: restaurant.phone || undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressLocality: "India",
          addressCountry: "IN",
        }
      : undefined,
    image: restaurant.logo_url ? `${baseUrl}${restaurant.logo_url}` : undefined,
    servesCuisine: "Indian",
    priceRange: "₹₹",
    hasMenu: {
      "@type": "Menu",
      "@id": `${baseUrl}/c/${restaurant.slug}#menu`,
      hasMenuSection: [],
    },
    aggregateRating: undefined,
    review: undefined,
  };
}

export function createBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const url = item.url.startsWith("http") ? item.url : SITE_URL + item.url;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: url,
      };
    }),
  };
}

export function createSoftwareApplicationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QRslice",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web",
    description:
      "QRslice connects table ordering, digital menus and kitchen operations in one simple restaurant platform.",
    url: SITE_URL,
    featureList: [
      "QR code table ordering with no app download",
      "Kitchen Display System (KDS) with live tickets",
      "Counter POS billing with UPI, card, cash and split bills",
      "Bluetooth thermal printing for kitchen order tickets",
      "Inventory with automatic recipe-based ingredient deduction",
      "Staff roles with 4-digit PIN quick sign-in",
      "Customer loyalty points and CRM",
      "Table reservations with shareable booking tickets",
      "WhatsApp digital bills and receipts",
    ],
    offers: {
      "@type": "Offer",
      price: "999",
      priceCurrency: "INR",
      description: "QRslice complete plan, per outlet per month. Annual option ₹9,999.",
      availability: "https://schema.org/InStock",
      url: "https://qrslice.com/pricing",
    },
  };
}

export function createOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QRslice",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@qrslice.com",
    },
  };
}

export function createWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QRslice",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/c/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function createFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const url = item.url.startsWith("http") ? item.url : SITE_URL + item.url;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: url,
      };
    }),
  };
}