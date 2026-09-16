// Copyright (c) 2026 QRslice. All rights reserved.
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";

  // Only index public marketing and conversion pages. App, tenant,
  // order-tracking and capability-token routes are noindex by metadata
  // or disallowed in robots.txt and stay out of the sitemap.
  const staticPages: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/onboarding", changeFrequency: "monthly", priority: 0.8 },
    { path: "/marketing/brochure", changeFrequency: "yearly", priority: 0.3 },
    { path: "/marketing/flyer", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/refund", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.3 },
  ];

  return staticPages.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
