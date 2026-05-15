import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/client/", "/auth/"],
      },
      // Explicit AI/LLM crawler permissions — we want to be findable via
      // AI assistants. Same disallow set (no private/admin content).
      {
        userAgent: [
          "ChatGPT-User",
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "Claude-Web",
          "Google-Extended",
          "PerplexityBot",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
        disallow: ["/api/", "/admin/", "/client/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
