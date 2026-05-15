import type { LeadStatus, ProjectStatus, ServiceType } from "@prisma/client";

/**
 * FR-only constants kept for the AI lead-scoring prompt (which is FR-only on purpose).
 * For UI rendering, use getFormat(locale) (server) or useFormat() (client) instead —
 * those return localized labels via next-intl.
 */
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

type Locale = "fr" | "en" | "es";

const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

const TIME_AGO_NOW: Record<Locale, string> = {
  fr: "à l'instant",
  en: "just now",
  es: "ahora mismo",
};

function timeAgoFormat(locale: Locale, n: number, unit: "minutes" | "hours" | "days") {
  const tables: Record<Locale, Record<"minutes" | "hours" | "days", (n: number) => string>> = {
    fr: {
      minutes: (n) => `il y a ${n} min`,
      hours: (n) => `il y a ${n}h`,
      days: (n) => `il y a ${n}j`,
    },
    en: {
      minutes: (n) => `${n} min ago`,
      hours: (n) => `${n}h ago`,
      days: (n) => `${n}d ago`,
    },
    es: {
      minutes: (n) => `hace ${n} min`,
      hours: (n) => `hace ${n}h`,
      days: (n) => `hace ${n}d`,
    },
  };
  return tables[locale][unit](n);
}

const SERVICE_LABELS: Record<Locale, Record<ServiceType, string>> = {
  fr: SERVICE_LABEL,
  en: {
    VITRINE: "Marketing site",
    ECOMMERCE: "E-commerce",
    SHOPIFY: "Shopify",
    LOVABLE_TO_APP: "Lovable→App",
    SAAS_MVP: "SaaS MVP",
    MOBILE_APP: "Mobile app",
    OTHER: "Other",
  },
  es: {
    VITRINE: "Web corporativa",
    ECOMMERCE: "E-commerce",
    SHOPIFY: "Shopify",
    LOVABLE_TO_APP: "Lovable→App",
    SAAS_MVP: "SaaS MVP",
    MOBILE_APP: "App móvil",
    OTHER: "Otro",
  },
};

const LEAD_STATUS_LABELS: Record<Locale, Record<LeadStatus, string>> = {
  fr: LEAD_STATUS_LABEL,
  en: {
    NEW: "New",
    CONTACTED: "Contacted",
    QUALIFIED: "Qualified",
    WON: "Won",
    LOST: "Lost",
  },
  es: {
    NEW: "Nuevo",
    CONTACTED: "Contactado",
    QUALIFIED: "Cualificado",
    WON: "Ganado",
    LOST: "Perdido",
  },
};

const PROJECT_STATUS_LABELS: Record<Locale, Record<ProjectStatus, string>> = {
  fr: PROJECT_STATUS_LABEL,
  en: {
    DRAFT: "Brief",
    QUOTED: "Quote sent",
    SIGNED: "Signed",
    IN_PROGRESS: "In progress",
    IN_REVIEW: "In review",
    SHIPPED: "Shipped",
    ARCHIVED: "Archived",
  },
  es: {
    DRAFT: "Brief",
    QUOTED: "Presupuesto enviado",
    SIGNED: "Firmado",
    IN_PROGRESS: "En curso",
    IN_REVIEW: "En review",
    SHIPPED: "Entregado",
    ARCHIVED: "Archivado",
  },
};

function asLocale(input: string | undefined): Locale {
  if (input === "en" || input === "es") return input;
  return "fr";
}

/**
 * Returns a bundle of locale-aware formatters and label maps.
 * Call with the active locale from next-intl (`await getLocale()` server / `useLocale()` client).
 */
export function getFormat(localeInput: string | undefined) {
  const locale = asLocale(localeInput);
  const intlLocale = INTL_LOCALE[locale];

  const serviceLabel = SERVICE_LABELS[locale];
  const leadStatusLabel = LEAD_STATUS_LABELS[locale];
  const projectStatusLabel = PROJECT_STATUS_LABELS[locale];

  function formatEUR(cents?: number | null) {
    if (cents == null) return "—";
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatPriceRange(min?: number | null, max?: number | null) {
    if (min == null || max == null) return "—";
    return `${min}€ – ${max}€`;
  }

  function formatDate(date?: Date | string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat(intlLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatDateTime(date?: Date | string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat(intlLocale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function timeAgo(date: Date | string) {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return TIME_AGO_NOW[locale];
    const min = Math.floor(sec / 60);
    if (min < 60) return timeAgoFormat(locale, min, "minutes");
    const hr = Math.floor(min / 60);
    if (hr < 24) return timeAgoFormat(locale, hr, "hours");
    const day = Math.floor(hr / 24);
    if (day < 7) return timeAgoFormat(locale, day, "days");
    return formatDate(d);
  }

  return {
    locale,
    serviceLabel,
    leadStatusLabel,
    projectStatusLabel,
    formatEUR,
    formatPriceRange,
    formatDate,
    formatDateTime,
    timeAgo,
  };
}

/**
 * Legacy FR-only helpers — kept for backwards compatibility with non-locale-aware
 * call sites and the AI score-lead prompt. Prefer getFormat(locale).
 */
const FR = getFormat("fr");
export const formatEUR = FR.formatEUR;
export const formatPriceRange = FR.formatPriceRange;
export const formatDate = FR.formatDate;
export const formatDateTime = FR.formatDateTime;
export const timeAgo = FR.timeAgo;
