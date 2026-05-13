import type { LeadStatus, ProjectStatus, ServiceType } from "@prisma/client";

export const SERVICE_LABEL: Record<ServiceType, string> = {
  VITRINE: "Site vitrine",
  ECOMMERCE: "E-commerce",
  SHOPIFY: "Shopify",
  LOVABLE_TO_APP: "Lovable→App",
  SAAS_MVP: "SaaS MVP",
  MOBILE_APP: "App mobile",
  OTHER: "Autre",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  WON: "Gagné",
  LOST: "Perdu",
};

export const LEAD_STATUS_COLOR: Record<LeadStatus, string> = {
  NEW: "bg-lime/15 text-lime border-lime/30",
  CONTACTED: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  QUALIFIED: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  WON: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  LOST: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: "Brief",
  QUOTED: "Devis envoyé",
  SIGNED: "Signé",
  IN_PROGRESS: "En cours",
  IN_REVIEW: "En review",
  SHIPPED: "Livré",
  ARCHIVED: "Archivé",
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  DRAFT: "bg-surface-2 text-muted-foreground border-border",
  QUOTED: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  SIGNED: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  IN_PROGRESS: "bg-lime/15 text-lime border-lime/30",
  IN_REVIEW: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  SHIPPED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ARCHIVED: "bg-surface-2 text-muted-2 border-border",
};

export function formatEUR(cents?: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPriceRange(min?: number | null, max?: number | null) {
  if (min == null || max == null) return "—";
  return `${min}€ – ${max}€`;
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date?: Date | string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `il y a ${day}j`;
  return formatDate(d);
}
