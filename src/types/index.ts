export type Locale = "fr" | "en" | "es";

export type ServiceType =
  | "VITRINE"
  | "ECOMMERCE"
  | "SHOPIFY"
  | "LOVABLE_TO_APP"
  | "SAAS_MVP"
  | "MOBILE_APP"
  | "OTHER";

export type Timeline = "asap" | "1month" | "3months" | "flexible";

export type Budget = "<1k" | "1k-3k" | "3k-10k" | "10k+" | "undefined";

export const SERVICE_KEYS = ["vitrine", "ecommerce", "shopify", "lovable", "saas", "mobile"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_KEY_TO_TYPE: Record<ServiceKey, ServiceType> = {
  vitrine: "VITRINE",
  ecommerce: "ECOMMERCE",
  shopify: "SHOPIFY",
  lovable: "LOVABLE_TO_APP",
  saas: "SAAS_MVP",
  mobile: "MOBILE_APP",
};
