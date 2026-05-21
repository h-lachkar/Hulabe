import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";

/**
 * Per-route `lastModified` dates. Update these when you ship a meaningful
 * change to the corresponding page — they signal freshness to Google.
 *
 * Avoid `new Date()` here: a moving timestamp on every build trains crawlers
 * to ignore the field. Hulabe's structure is mostly static so explicit dates
 * are more honest.
 */
type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified: string; // ISO date (YYYY-MM-DD)
};

const ROUTES: Route[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1.0,
    lastModified: "2026-05-21",
  },
  {
    path: "/simulator",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: "2026-05-21",
  },
  {
    path: "/legal/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: "2026-05-09",
  },
  {
    path: "/legal/terms",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: "2026-05-09",
  },
  // Public text files — exposed so LLM crawlers and humans can discover them.
  {
    path: "/llms.txt",
    changeFrequency: "monthly",
    priority: 0.5,
    lastModified: "2026-05-21",
  },
  {
    path: "/ai.txt",
    changeFrequency: "monthly",
    priority: 0.5,
    lastModified: "2026-05-21",
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(r.lastModified),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    // Multilingual hint via Google's `alternates` field (App Router sitemap
    // supports this since Next.js 14.2). Cookie-based locale serves the same
    // URL for all 3 languages, so we declare them at the same href.
    alternates: {
      languages: {
        "fr-FR": `${SITE_URL}${r.path}`,
        "en-US": `${SITE_URL}${r.path}`,
        "es-ES": `${SITE_URL}${r.path}`,
        "x-default": `${SITE_URL}${r.path}`,
      },
    },
  }));
}
