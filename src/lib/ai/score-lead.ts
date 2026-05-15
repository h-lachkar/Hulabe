import Anthropic from "@anthropic-ai/sdk";
import type { Lead, ServiceType } from "@prisma/client";
import { SERVICE_LABEL } from "@/lib/admin/format";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

export type LeadScore = {
  score: number; // 1-10
  reasoning: string;
  suggestedReply: string;
  nextAction: "SEND_QUOTE" | "BOOK_CALL" | "ASK_CLARIFICATION" | "DECLINE_POLITELY";
  flags: string[];
  model: string;
};

const SYSTEM_PROMPT = `Tu es Hugo, fondateur de Hulabe — un dev studio (1 personne) qui vend 6 services packagés avec prix et délais affichés :

- VITRINE: site marketing pro (800-2 500€, 1-2 semaines)
- ECOMMERCE: boutique Shopify ou custom (1 500-5 000€, 2-3 semaines)
- SHOPIFY: dev Shopify custom, apps, themes (500-3 000€, 1-3 semaines)
- LOVABLE_TO_APP: migration MVP no-code en code propre (2 000-8 000€, 2-4 semaines)
- SAAS_MVP: SaaS MVP complet auth/billing/dashboard (5 000-15 000€, 4-8 semaines)
- MOBILE_APP: app React Native iOS+Android (4 000-12 000€, 4-8 semaines)
- OTHER: projet sur mesure (1 000-8 000€)

Ta voix : direct, builder, no-bullshit. Tu tutoies en FR. Pas de "passion", pas de "transformation digitale". Tu parles Stripe, Next.js, Supabase. Tu refuses les projets si le budget n'est pas réaliste.

Process : brief 30min → devis sous 24h → démarrage sous 7j → 14 jours support inclus. Paiement 30/30/40.

Ton job : analyser un nouveau lead et en sortir :
1. Un score 1-10 de "deal probability" (combien c'est probable que ce lead devienne un client payant)
2. 2-3 phrases de raisonnement (en français, ton casual builder)
3. Une suggestion de réponse personnalisée (un email court, ton casual, 3-6 phrases, signé "Hugo")
4. La prochaine action recommandée (SEND_QUOTE, BOOK_CALL, ASK_CLARIFICATION, DECLINE_POLITELY)
5. Une liste de flags (red flags ou highlights) — chaîne courte chacun, ex: "budget trop bas", "deadline irréaliste", "fit parfait avec migration Lovable", "scope flou"

Tu retournes STRICTEMENT du JSON valide, rien d'autre, dans ce format exact :

{
  "score": 1-10 entier,
  "reasoning": "string",
  "suggested_reply": "string (3-6 phrases, signé Hugo)",
  "next_action": "SEND_QUOTE" | "BOOK_CALL" | "ASK_CLARIFICATION" | "DECLINE_POLITELY",
  "flags": ["short string", "..."]
}`;

function buildUserMessage(lead: Lead): string {
  const service = lead.serviceType
    ? SERVICE_LABEL[lead.serviceType as ServiceType] + ` (${lead.serviceType})`
    : "Non spécifié";
  const estimate =
    lead.estimatedPriceMin != null && lead.estimatedPriceMax != null
      ? `${lead.estimatedPriceMin}€ – ${lead.estimatedPriceMax}€`
      : "Non calculé";
  const features =
    lead.features.length > 0 ? lead.features.join("\n- ") : "Aucun";

  return `Nouveau lead reçu via ${lead.source}. Voici les infos :

- Nom: ${lead.name ?? "Non fourni"}
- Email: ${lead.email}
- Téléphone: ${lead.phone ?? "Non fourni"}
- Locale: ${lead.locale}
- Service demandé: ${service}
- Budget annoncé: ${lead.budget ?? "Non spécifié"}
- Délai souhaité: ${lead.timeline ?? "Non spécifié"}
- Estimation Hulabe (algorithmique): ${estimate}
- Réponses simulator / features:
- ${features}

Message libre du lead:
"""
${lead.message ?? "(aucun message)"}
"""

Évalue ce lead et retourne le JSON demandé.`;
}

/**
 * Score a lead via Claude. Returns null if ANTHROPIC_API_KEY is missing
 * (so dev/preview without the key still works). Throws on API errors.
 */
export async function scoreLead(lead: Lead): Promise<LeadScore | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(lead),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content from Claude");
  }

  // Parse JSON. Claude sometimes wraps in ```json fences — strip them.
  const raw = textBlock.text.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Invalid JSON from Claude: ${cleaned.slice(0, 200)}`);
  }

  const p = parsed as Partial<{
    score: number;
    reasoning: string;
    suggested_reply: string;
    next_action: string;
    flags: string[];
  }>;

  const score = Math.max(1, Math.min(10, Math.round(Number(p.score ?? 5))));
  const nextActionRaw = (p.next_action ?? "ASK_CLARIFICATION") as string;
  const validActions: Array<LeadScore["nextAction"]> = [
    "SEND_QUOTE",
    "BOOK_CALL",
    "ASK_CLARIFICATION",
    "DECLINE_POLITELY",
  ];
  const nextAction = validActions.includes(nextActionRaw as LeadScore["nextAction"])
    ? (nextActionRaw as LeadScore["nextAction"])
    : "ASK_CLARIFICATION";

  return {
    score,
    reasoning: String(p.reasoning ?? "").trim(),
    suggestedReply: String(p.suggested_reply ?? "").trim(),
    nextAction,
    flags: Array.isArray(p.flags) ? p.flags.filter((f) => typeof f === "string") : [],
    model: MODEL,
  };
}
