import { z } from "zod";

export const ServiceTypeEnum = z.enum([
  "VITRINE",
  "ECOMMERCE",
  "SHOPIFY",
  "LOVABLE_TO_APP",
  "SAAS_MVP",
  "MOBILE_APP",
  "OTHER",
]);

export const TimelineEnum = z.enum(["asap", "1month", "3months", "flexible"]);
export const BudgetEnum = z.enum(["<1k", "1k-3k", "3k-10k", "10k+", "undefined"]);
export const LocaleEnum = z.enum(["fr", "en", "es"]);

/** Free-form per-step answer: string for single/text, string[] for multi. */
export const FlowAnswerSchema = z.union([
  z.string().max(2000),
  z.array(z.string().max(64)).max(20),
]);

export const simulatorSchema = z.object({
  serviceType: ServiceTypeEnum,
  answers: z.record(z.string().max(64), FlowAnswerSchema),
  timeline: TimelineEnum,
  budget: BudgetEnum,
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  consent: z.literal(true),
  locale: LocaleEnum,
});

export type SimulatorPayload = z.infer<typeof simulatorSchema>;

export const contactSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(2000),
  locale: LocaleEnum,
});

export type ContactPayload = z.infer<typeof contactSchema>;
