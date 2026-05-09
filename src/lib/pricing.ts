import type { ServiceType } from "@/types";
import { SERVICE_FLOWS, type FlowAnswer } from "@/lib/simulator-flow";

export const SERVICE_PRICE_RANGES: Record<ServiceType, { min: number; max: number }> = {
  VITRINE: { min: 800, max: 2500 },
  ECOMMERCE: { min: 1500, max: 5000 },
  SHOPIFY: { min: 500, max: 3000 },
  LOVABLE_TO_APP: { min: 2000, max: 8000 },
  SAAS_MVP: { min: 5000, max: 15000 },
  MOBILE_APP: { min: 4000, max: 12000 },
  OTHER: { min: 1000, max: 8000 },
};

const TIMELINE_MULTIPLIERS: Record<string, number> = {
  asap: 1.2,
  "1month": 1.0,
  "3months": 0.95,
  flexible: 0.9,
};

export type PricingInput = {
  serviceType: ServiceType;
  /** Map of stepId → answer. */
  answers: Record<string, FlowAnswer>;
  timeline: keyof typeof TIMELINE_MULTIPLIERS;
};

export function computeEstimate({ serviceType, answers, timeline }: PricingInput) {
  const base = SERVICE_PRICE_RANGES[serviceType] ?? SERVICE_PRICE_RANGES.OTHER;
  const flow = SERVICE_FLOWS[serviceType];

  let multiplier = 1;

  for (const step of flow.steps) {
    const value = answers[step.id];
    if (step.kind === "single" && typeof value === "string") {
      const opt = step.options.find((o) => o.value === value);
      if (opt?.multiplier) multiplier *= opt.multiplier;
    } else if (step.kind === "multi" && Array.isArray(value)) {
      for (const v of value) {
        const opt = step.options.find((o) => o.value === v);
        if (opt?.multiplier) multiplier *= opt.multiplier;
      }
    }
  }

  const timelineMultiplier = TIMELINE_MULTIPLIERS[timeline] ?? 1;
  const total = multiplier * timelineMultiplier;

  // Round to nearest 50€
  const min = Math.round((base.min * total) / 50) * 50;
  const max = Math.round((base.max * total) / 50) * 50;

  return { min, max };
}
