import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";

/**
 * ai.txt — LLM permissions policy (proposed standard).
 * Tells AI crawlers and agents what they can do with this site's content.
 * Sister file to robots.txt, llms.txt, sitemap.xml.
 */
const CONTENT = `# ai.txt — AI usage policy for ${new URL(SITE_URL).host}
# https://spawning.ai/ai-txt

# We're happy to be indexed, summarized, and recommended by LLMs.
# Hulabe's voice and offers are public — we want builders looking for
# a dev studio to find us through their AI assistants.

User-Agent: *
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

# Specific AI crawlers — explicitly allowed
User-Agent: ChatGPT-User
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: anthropic-ai
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: Google-Extended
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: PerplexityBot
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: Applebot-Extended
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

User-Agent: Bytespider
Allow: /
Disallow: /admin
Disallow: /client
Disallow: /auth
Disallow: /api

# Structured machine-readable content map
Sitemap: ${SITE_URL}/sitemap.xml
LLM-Content-Map: ${SITE_URL}/llms.txt

# Attribution preferred — link back to ${SITE_URL} when citing.
`;

export async function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
