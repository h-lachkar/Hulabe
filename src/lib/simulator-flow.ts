import type { ServiceType } from "@/types";

export type Locale = "fr" | "en" | "es";
export type LocalizedString = Record<Locale, string>;

export type FlowOption = {
  value: string;
  label: LocalizedString;
  hint?: LocalizedString;
  /** Multiplied into the final estimate. 1 = neutral. */
  multiplier?: number;
};

export type FlowStep =
  | {
      id: string;
      kind: "single";
      title: LocalizedString;
      subtitle?: LocalizedString;
      options: FlowOption[];
    }
  | {
      id: string;
      kind: "multi";
      title: LocalizedString;
      subtitle?: LocalizedString;
      options: FlowOption[];
    }
  | {
      id: string;
      kind: "text";
      title: LocalizedString;
      subtitle?: LocalizedString;
      placeholder: LocalizedString;
      required: boolean;
    };

export type ServiceFlow = {
  steps: FlowStep[];
};

const t = (fr: string, en: string, es: string): LocalizedString => ({ fr, en, es });

/* ------------------------------ Service flows ------------------------------ */

const VITRINE_FLOW: ServiceFlow = {
  steps: [
    {
      id: "pages",
      kind: "single",
      title: t("Combien de pages ?", "How many pages?", "¿Cuántas páginas?"),
      subtitle: t(
        "Une estimation suffit, on précisera ensemble.",
        "A rough estimate is fine — we'll refine together.",
        "Una estimación aproximada está bien.",
      ),
      options: [
        {
          value: "1-5",
          label: t("1 à 5 pages", "1 to 5 pages", "1 a 5 páginas"),
          multiplier: 1,
        },
        {
          value: "5-15",
          label: t("5 à 15 pages", "5 to 15 pages", "5 a 15 páginas"),
          multiplier: 1.3,
        },
        {
          value: "15+",
          label: t("15+ pages", "15+ pages", "15+ páginas"),
          multiplier: 1.7,
        },
      ],
    },
    {
      id: "cms",
      kind: "single",
      title: t(
        "CMS pour modifier le contenu ?",
        "CMS to edit content?",
        "¿CMS para editar contenido?",
      ),
      options: [
        {
          value: "none",
          label: t(
            "Non, contenu fixe",
            "No, static content",
            "No, contenido fijo",
          ),
          multiplier: 1,
        },
        {
          value: "simple",
          label: t(
            "Simple — je veux modifier les textes",
            "Simple — let me edit copy",
            "Simple — para editar textos",
          ),
          multiplier: 1.15,
        },
        {
          value: "advanced",
          label: t(
            "Avancé — Notion, Sanity, ou équivalent",
            "Advanced — Notion, Sanity, or similar",
            "Avanzado — Notion, Sanity o similar",
          ),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "extras",
      kind: "multi",
      title: t(
        "Ajouts spécifiques ?",
        "Specific add-ons?",
        "¿Complementos específicos?",
      ),
      subtitle: t(
        "Coche tout ce qui s'applique.",
        "Check anything that applies.",
        "Marca lo que aplique.",
      ),
      options: [
        {
          value: "blog",
          label: t("Blog / actualités", "Blog / news", "Blog / noticias"),
          multiplier: 1.1,
        },
        {
          value: "multilang",
          label: t(
            "Multilingue (2+ langues)",
            "Multilingual (2+ languages)",
            "Multilingüe (2+ idiomas)",
          ),
          multiplier: 1.15,
        },
        {
          value: "animations",
          label: t(
            "Animations custom",
            "Custom animations",
            "Animaciones custom",
          ),
          multiplier: 1.1,
        },
        {
          value: "newsletter",
          label: t(
            "Capture newsletter",
            "Newsletter capture",
            "Captura newsletter",
          ),
          multiplier: 1.05,
        },
        {
          value: "seo",
          label: t(
            "SEO avancé (technique + contenu)",
            "Advanced SEO (technical + content)",
            "SEO avanzado (técnico + contenido)",
          ),
          multiplier: 1.15,
        },
        {
          value: "form",
          label: t(
            "Formulaire de contact custom",
            "Custom contact form",
            "Formulario de contacto custom",
          ),
          multiplier: 1.05,
        },
      ],
    },
  ],
};

const ECOMMERCE_FLOW: ServiceFlow = {
  steps: [
    {
      id: "platform",
      kind: "single",
      title: t(
        "Plateforme préférée ?",
        "Preferred platform?",
        "¿Plataforma preferida?",
      ),
      subtitle: t(
        "Si tu hésites, on te conseille au brief.",
        "If you're unsure, we'll advise at the brief.",
        "Si dudas, te aconsejamos en el brief.",
      ),
      options: [
        {
          value: "shopify",
          label: t(
            "Shopify (le plus rapide)",
            "Shopify (fastest)",
            "Shopify (lo más rápido)",
          ),
          multiplier: 1,
        },
        {
          value: "woocommerce",
          label: t("WooCommerce / WordPress", "WooCommerce / WordPress", "WooCommerce / WordPress"),
          multiplier: 1.1,
        },
        {
          value: "custom",
          label: t(
            "Custom (Next.js + Stripe)",
            "Custom (Next.js + Stripe)",
            "Custom (Next.js + Stripe)",
          ),
          multiplier: 1.4,
        },
        {
          value: "unsure",
          label: t(
            "Je ne sais pas encore",
            "Not sure yet",
            "No estoy seguro",
          ),
          multiplier: 1,
        },
      ],
    },
    {
      id: "skus",
      kind: "single",
      title: t(
        "Combien de produits / SKUs ?",
        "How many products / SKUs?",
        "¿Cuántos productos / SKUs?",
      ),
      options: [
        {
          value: "<50",
          label: t("Moins de 50", "Under 50", "Menos de 50"),
          multiplier: 1,
        },
        {
          value: "50-500",
          label: t("50 à 500", "50 to 500", "50 a 500"),
          multiplier: 1.15,
        },
        {
          value: "500+",
          label: t("500+", "500+", "500+"),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "ecom-features",
      kind: "multi",
      title: t(
        "Fonctionnalités e-com ?",
        "E-commerce features?",
        "¿Funcionalidades e-commerce?",
      ),
      options: [
        {
          value: "multi-currency",
          label: t(
            "Multi-devises / multi-pays",
            "Multi-currency / multi-country",
            "Multi-divisa / multi-país",
          ),
          multiplier: 1.15,
        },
        {
          value: "subscriptions",
          label: t(
            "Abonnements récurrents",
            "Recurring subscriptions",
            "Suscripciones recurrentes",
          ),
          multiplier: 1.2,
        },
        {
          value: "loyalty",
          label: t(
            "Programme fidélité / points",
            "Loyalty program / points",
            "Programa de fidelidad / puntos",
          ),
          multiplier: 1.15,
        },
        {
          value: "b2b-pricing",
          label: t(
            "Tarifs B2B / par client",
            "B2B / per-customer pricing",
            "Tarifas B2B / por cliente",
          ),
          multiplier: 1.2,
        },
        {
          value: "stock-sync",
          label: t(
            "Sync stock externe (ERP, POS)",
            "External stock sync (ERP, POS)",
            "Sync stock externo (ERP, POS)",
          ),
          multiplier: 1.25,
        },
        {
          value: "custom-checkout",
          label: t(
            "Checkout personnalisé",
            "Custom checkout",
            "Checkout personalizado",
          ),
          multiplier: 1.2,
        },
      ],
    },
    {
      id: "design",
      kind: "single",
      title: t(
        "Design — d'où on part ?",
        "Design — starting point?",
        "Diseño — ¿punto de partida?",
      ),
      options: [
        {
          value: "theme",
          label: t(
            "Theme existant ajusté",
            "Adjusted existing theme",
            "Tema existente ajustado",
          ),
          multiplier: 1,
        },
        {
          value: "custom-light",
          label: t(
            "Theme custom léger",
            "Light custom theme",
            "Tema custom ligero",
          ),
          multiplier: 1.2,
        },
        {
          value: "custom-full",
          label: t(
            "Design 100% custom",
            "100% custom design",
            "Diseño 100% custom",
          ),
          multiplier: 1.4,
        },
      ],
    },
  ],
};

const SHOPIFY_FLOW: ServiceFlow = {
  steps: [
    {
      id: "shopify-type",
      kind: "single",
      title: t(
        "Quel type de chantier ?",
        "What kind of work?",
        "¿Qué tipo de trabajo?",
      ),
      options: [
        {
          value: "theme-tweak",
          label: t(
            "Ajustement de theme existant",
            "Existing theme tweaks",
            "Ajuste de tema existente",
          ),
          multiplier: 1,
        },
        {
          value: "theme-custom",
          label: t(
            "Theme custom complet",
            "Full custom theme",
            "Tema custom completo",
          ),
          multiplier: 1.4,
        },
        {
          value: "app-public",
          label: t(
            "App Shopify (publique ou privée)",
            "Shopify app (public or private)",
            "App Shopify (pública o privada)",
          ),
          multiplier: 1.6,
        },
        {
          value: "integration",
          label: t(
            "Intégration tierce (ERP, CRM, …)",
            "Third-party integration (ERP, CRM, …)",
            "Integración tercera (ERP, CRM, …)",
          ),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "shopify-store",
      kind: "single",
      title: t(
        "La boutique existe déjà ?",
        "Does the store already exist?",
        "¿La tienda ya existe?",
      ),
      options: [
        {
          value: "yes",
          label: t(
            "Oui, on intervient dessus",
            "Yes, we work on it",
            "Sí, trabajamos sobre ella",
          ),
          multiplier: 1,
        },
        {
          value: "no",
          label: t(
            "Non, à créer",
            "No, to create",
            "No, hay que crearla",
          ),
          multiplier: 1.1,
        },
      ],
    },
    {
      id: "shopify-extras",
      kind: "multi",
      title: t(
        "Ajouts spécifiques ?",
        "Specific add-ons?",
        "¿Complementos específicos?",
      ),
      options: [
        {
          value: "hydrogen",
          label: t(
            "Frontend Hydrogen / headless",
            "Hydrogen / headless front",
            "Frontend Hydrogen / headless",
          ),
          multiplier: 1.3,
        },
        {
          value: "metaobjects",
          label: t(
            "Metaobjects / contenu structuré",
            "Metaobjects / structured content",
            "Metaobjects / contenido estructurado",
          ),
          multiplier: 1.1,
        },
        {
          value: "checkout-ext",
          label: t(
            "Checkout extensions",
            "Checkout extensions",
            "Checkout extensions",
          ),
          multiplier: 1.2,
        },
        {
          value: "multistore",
          label: t(
            "Multi-stores Shopify Plus",
            "Multi-stores (Shopify Plus)",
            "Multi-tienda Shopify Plus",
          ),
          multiplier: 1.3,
        },
      ],
    },
  ],
};

const LOVABLE_FLOW: ServiceFlow = {
  steps: [
    {
      id: "no-code-stack",
      kind: "single",
      title: t(
        "Sur quoi ton MVP tourne aujourd'hui ?",
        "What's your MVP running on today?",
        "¿En qué corre tu MVP hoy?",
      ),
      options: [
        {
          value: "lovable",
          label: t("Lovable", "Lovable", "Lovable"),
          multiplier: 1,
        },
        {
          value: "bolt",
          label: t(
            "Bolt.new / V0 / autre AI builder",
            "Bolt.new / V0 / other AI builder",
            "Bolt.new / V0 / otro AI builder",
          ),
          multiplier: 1,
        },
        {
          value: "bubble",
          label: t("Bubble", "Bubble", "Bubble"),
          multiplier: 1.15,
        },
        {
          value: "webflow-memberstack",
          label: t(
            "Webflow + Memberstack / Wized",
            "Webflow + Memberstack / Wized",
            "Webflow + Memberstack / Wized",
          ),
          multiplier: 1.1,
        },
        {
          value: "other",
          label: t(
            "Autre / hybride",
            "Other / hybrid",
            "Otro / híbrido",
          ),
          multiplier: 1.05,
        },
      ],
    },
    {
      id: "no-code-users",
      kind: "single",
      title: t(
        "Combien d'utilisateurs actifs ?",
        "How many active users?",
        "¿Cuántos usuarios activos?",
      ),
      subtitle: t(
        "Influence la priorité migration de données.",
        "Affects data migration priority.",
        "Influye en la prioridad de migración de datos.",
      ),
      options: [
        {
          value: "0",
          label: t(
            "Aucun encore (pré-launch)",
            "None yet (pre-launch)",
            "Ninguno todavía (pre-launch)",
          ),
          multiplier: 0.95,
        },
        {
          value: "<100",
          label: t("Moins de 100", "Under 100", "Menos de 100"),
          multiplier: 1,
        },
        {
          value: "100-1k",
          label: t("100 à 1 000", "100 to 1,000", "100 a 1 000"),
          multiplier: 1.1,
        },
        {
          value: "1k+",
          label: t("1 000+", "1,000+", "1 000+"),
          multiplier: 1.25,
        },
      ],
    },
    {
      id: "no-code-keep",
      kind: "single",
      title: t(
        "On préserve les données existantes ?",
        "Preserve existing data?",
        "¿Preservar los datos existentes?",
      ),
      options: [
        {
          value: "no",
          label: t(
            "Non, on repart propre",
            "No, fresh start",
            "No, empezamos limpios",
          ),
          multiplier: 1,
        },
        {
          value: "yes-simple",
          label: t(
            "Oui, migration simple",
            "Yes, simple migration",
            "Sí, migración simple",
          ),
          multiplier: 1.1,
        },
        {
          value: "yes-complex",
          label: t(
            "Oui, schéma complexe à mapper",
            "Yes, complex schema to map",
            "Sí, esquema complejo que mapear",
          ),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "no-code-features",
      kind: "multi",
      title: t(
        "Ce que la version code doit ABSOLUMENT améliorer ?",
        "What the code version MUST improve?",
        "¿Qué debe mejorar la versión código?",
      ),
      options: [
        {
          value: "perf",
          label: t(
            "Performance (page speed, scale)",
            "Performance (page speed, scale)",
            "Rendimiento (velocidad, escala)",
          ),
          multiplier: 1.1,
        },
        {
          value: "auth",
          label: t(
            "Auth complexe (rôles, multi-tenant)",
            "Complex auth (roles, multi-tenant)",
            "Auth complejo (roles, multi-tenant)",
          ),
          multiplier: 1.2,
        },
        {
          value: "logic",
          label: t(
            "Logique métier custom",
            "Custom business logic",
            "Lógica de negocio custom",
          ),
          multiplier: 1.15,
        },
        {
          value: "integrations",
          label: t(
            "Intégrations API tierces",
            "Third-party API integrations",
            "Integraciones API terceros",
          ),
          multiplier: 1.15,
        },
        {
          value: "design",
          label: t(
            "Design 100% custom",
            "100% custom design",
            "Diseño 100% custom",
          ),
          multiplier: 1.15,
        },
      ],
    },
  ],
};

const SAAS_FLOW: ServiceFlow = {
  steps: [
    {
      id: "saas-tenancy",
      kind: "single",
      title: t(
        "Modèle d'utilisateurs ?",
        "User model?",
        "¿Modelo de usuarios?",
      ),
      options: [
        {
          value: "single",
          label: t(
            "Comptes individuels (B2C)",
            "Individual accounts (B2C)",
            "Cuentas individuales (B2C)",
          ),
          multiplier: 1,
        },
        {
          value: "team",
          label: t(
            "Équipes / organisations (B2B)",
            "Teams / organizations (B2B)",
            "Equipos / organizaciones (B2B)",
          ),
          multiplier: 1.2,
        },
        {
          value: "multi-tenant",
          label: t(
            "Multi-tenant strict (data isolée par client)",
            "Strict multi-tenant (isolated data)",
            "Multi-tenant estricto (datos aislados)",
          ),
          multiplier: 1.4,
        },
      ],
    },
    {
      id: "saas-billing",
      kind: "single",
      title: t(
        "Comment ils paient ?",
        "How do they pay?",
        "¿Cómo pagan?",
      ),
      options: [
        {
          value: "free",
          label: t(
            "Gratuit / pas de billing",
            "Free / no billing",
            "Gratis / sin billing",
          ),
          multiplier: 0.9,
        },
        {
          value: "one-time",
          label: t(
            "Paiement unique",
            "One-time payment",
            "Pago único",
          ),
          multiplier: 1,
        },
        {
          value: "subscription",
          label: t(
            "Abonnement Stripe",
            "Stripe subscription",
            "Suscripción Stripe",
          ),
          multiplier: 1.15,
        },
        {
          value: "usage",
          label: t(
            "Usage-based / metered",
            "Usage-based / metered",
            "Usage-based / medido",
          ),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "saas-features",
      kind: "multi",
      title: t(
        "Ce qu'il faut dans le MVP ?",
        "What's in the MVP?",
        "¿Qué incluye el MVP?",
      ),
      subtitle: t(
        "Plus c'est coché, plus c'est cher \u2014 mais on garde 8 semaines max.",
        "More boxes = pricier \u2014 but we keep 8 weeks max.",
        "Más casillas = más caro \u2014 pero mantenemos 8 semanas máx.",
      ),
      options: [
        {
          value: "auth-social",
          label: t(
            "Auth Google / Github / Magic link",
            "Auth Google / Github / Magic link",
            "Auth Google / Github / Magic link",
          ),
          multiplier: 1.05,
        },
        {
          value: "dashboard",
          label: t(
            "Dashboard utilisateur custom",
            "Custom user dashboard",
            "Dashboard de usuario custom",
          ),
          multiplier: 1.15,
        },
        {
          value: "admin",
          label: t(
            "Back-office admin",
            "Admin back-office",
            "Back-office admin",
          ),
          multiplier: 1.15,
        },
        {
          value: "api",
          label: t(
            "API REST publique + docs",
            "Public REST API + docs",
            "API REST pública + docs",
          ),
          multiplier: 1.2,
        },
        {
          value: "webhooks",
          label: t(
            "Webhooks sortants",
            "Outbound webhooks",
            "Webhooks salientes",
          ),
          multiplier: 1.1,
        },
        {
          value: "ai",
          label: t(
            "Intégration LLM (OpenAI, Claude…)",
            "LLM integration (OpenAI, Claude…)",
            "Integración LLM (OpenAI, Claude…)",
          ),
          multiplier: 1.2,
        },
        {
          value: "email",
          label: t(
            "Emails transactionnels (Resend)",
            "Transactional emails (Resend)",
            "Emails transaccionales (Resend)",
          ),
          multiplier: 1.05,
        },
      ],
    },
    {
      id: "saas-design",
      kind: "single",
      title: t(
        "Design ?",
        "Design?",
        "¿Diseño?",
      ),
      options: [
        {
          value: "shadcn",
          label: t(
            "shadcn/ui propre — efficace",
            "Clean shadcn/ui — efficient",
            "shadcn/ui limpio — eficiente",
          ),
          multiplier: 1,
        },
        {
          value: "branded",
          label: t(
            "Design system maison",
            "In-house design system",
            "Sistema de diseño propio",
          ),
          multiplier: 1.25,
        },
        {
          value: "have-figma",
          label: t(
            "J'ai déjà mes Figma",
            "I already have Figmas",
            "Ya tengo mis Figmas",
          ),
          multiplier: 1.15,
        },
      ],
    },
  ],
};

const MOBILE_FLOW: ServiceFlow = {
  steps: [
    {
      id: "platforms",
      kind: "single",
      title: t(
        "Plateformes cibles ?",
        "Target platforms?",
        "¿Plataformas objetivo?",
      ),
      options: [
        {
          value: "ios",
          label: t("iOS uniquement", "iOS only", "Solo iOS"),
          multiplier: 0.85,
        },
        {
          value: "android",
          label: t("Android uniquement", "Android only", "Solo Android"),
          multiplier: 0.85,
        },
        {
          value: "both",
          label: t(
            "iOS + Android (React Native)",
            "iOS + Android (React Native)",
            "iOS + Android (React Native)",
          ),
          multiplier: 1,
        },
      ],
    },
    {
      id: "backend",
      kind: "single",
      title: t(
        "Backend ?",
        "Backend?",
        "¿Backend?",
      ),
      options: [
        {
          value: "existing",
          label: t(
            "Existe déjà (on s'y connecte)",
            "Already exists (we plug in)",
            "Ya existe (nos conectamos)",
          ),
          multiplier: 0.9,
        },
        {
          value: "supabase",
          label: t(
            "À créer — Supabase / Firebase",
            "To create — Supabase / Firebase",
            "Por crear — Supabase / Firebase",
          ),
          multiplier: 1.1,
        },
        {
          value: "custom",
          label: t(
            "À créer — API custom",
            "To create — custom API",
            "Por crear — API custom",
          ),
          multiplier: 1.3,
        },
      ],
    },
    {
      id: "mobile-features",
      kind: "multi",
      title: t(
        "Fonctionnalités natives ?",
        "Native features?",
        "¿Funcionalidades nativas?",
      ),
      options: [
        {
          value: "push",
          label: t(
            "Notifications push",
            "Push notifications",
            "Notificaciones push",
          ),
          multiplier: 1.1,
        },
        {
          value: "geo",
          label: t(
            "Géolocalisation",
            "Geolocation",
            "Geolocalización",
          ),
          multiplier: 1.1,
        },
        {
          value: "in-app",
          label: t(
            "Achats in-app (StoreKit / Play Billing)",
            "In-app purchases (StoreKit / Play)",
            "Compras in-app (StoreKit / Play)",
          ),
          multiplier: 1.2,
        },
        {
          value: "offline",
          label: t(
            "Mode offline / sync",
            "Offline mode / sync",
            "Modo offline / sync",
          ),
          multiplier: 1.2,
        },
        {
          value: "deep-linking",
          label: t(
            "Deep linking / universal links",
            "Deep linking / universal links",
            "Deep linking / universal links",
          ),
          multiplier: 1.05,
        },
        {
          value: "camera",
          label: t(
            "Caméra / scan code-barre",
            "Camera / barcode scan",
            "Cámara / escaneo código",
          ),
          multiplier: 1.1,
        },
      ],
    },
    {
      id: "stores",
      kind: "single",
      title: t(
        "Soumission App Store / Play ?",
        "App Store / Play submission?",
        "¿Subida App Store / Play?",
      ),
      options: [
        {
          value: "yes",
          label: t(
            "Oui, on s'occupe de tout",
            "Yes, we handle everything",
            "Sí, lo gestionamos todo",
          ),
          multiplier: 1.1,
        },
        {
          value: "no",
          label: t(
            "Non, on a déjà nos comptes",
            "No, we already have accounts",
            "No, ya tenemos cuentas",
          ),
          multiplier: 1,
        },
      ],
    },
  ],
};

const OTHER_FLOW: ServiceFlow = {
  steps: [
    {
      id: "other-description",
      kind: "text",
      title: t(
        "Décris ton projet en quelques lignes",
        "Describe your project in a few lines",
        "Describe tu proyecto en pocas líneas",
      ),
      subtitle: t(
        "Plus c'est précis, mieux on peut chiffrer.",
        "The more specific, the better we can scope.",
        "Más específico = mejor estimación.",
      ),
      placeholder: t(
        "Ex: outil interne pour mon équipe RH, intégré à BambooHR, ~5 utilisateurs internes…",
        "E.g. internal HR tool, integrated with BambooHR, ~5 internal users…",
        "Ej: herramienta interna RR.HH., integrada con BambooHR, ~5 usuarios…",
      ),
      required: true,
    },
    {
      id: "other-complexity",
      kind: "single",
      title: t(
        "Complexité estimée ?",
        "Estimated complexity?",
        "¿Complejidad estimada?",
      ),
      options: [
        {
          value: "low",
          label: t(
            "Faible — quelques pages, peu de logique",
            "Low — few pages, little logic",
            "Baja — pocas páginas, poca lógica",
          ),
          multiplier: 0.8,
        },
        {
          value: "medium",
          label: t(
            "Moyenne — logique métier, base de données",
            "Medium — business logic, database",
            "Media — lógica de negocio, base de datos",
          ),
          multiplier: 1.1,
        },
        {
          value: "high",
          label: t(
            "Élevée — multi-utilisateurs, API, intégrations",
            "High — multi-user, API, integrations",
            "Alta — multi-usuario, API, integraciones",
          ),
          multiplier: 1.5,
        },
      ],
    },
  ],
};

export const SERVICE_FLOWS: Record<ServiceType, ServiceFlow> = {
  VITRINE: VITRINE_FLOW,
  ECOMMERCE: ECOMMERCE_FLOW,
  SHOPIFY: SHOPIFY_FLOW,
  LOVABLE_TO_APP: LOVABLE_FLOW,
  SAAS_MVP: SAAS_FLOW,
  MOBILE_APP: MOBILE_FLOW,
  OTHER: OTHER_FLOW,
};

/* --------------------------------- Helpers -------------------------------- */

export type FlowAnswer = string | string[] | null;

export function isStepValid(step: FlowStep, answer: FlowAnswer): boolean {
  if (step.kind === "single") return typeof answer === "string" && answer.length > 0;
  if (step.kind === "multi") return true;
  if (step.kind === "text") {
    if (!step.required) return true;
    return typeof answer === "string" && answer.trim().length >= 5;
  }
  return false;
}

export function answerLabel(step: FlowStep, answer: FlowAnswer, locale: Locale): string {
  if (step.kind === "text") return typeof answer === "string" ? answer : "";
  const values = Array.isArray(answer) ? answer : answer ? [answer] : [];
  if (step.kind === "single" || step.kind === "multi") {
    return values
      .map((v) => step.options.find((o) => o.value === v)?.label[locale] ?? v)
      .join(", ");
  }
  return "";
}
