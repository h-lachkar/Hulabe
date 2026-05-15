import type { Locale } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

type Service = {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  priceMin: number;
  priceMax: number;
  durationLabel: Record<Locale, string>;
};

const SERVICES: Service[] = [
  {
    slug: "vitrine",
    name: {
      fr: "Site vitrine",
      en: "Marketing site",
      es: "Web corporativa",
    },
    description: {
      fr: "Site web professionnel développé en Next.js, livré en 1-2 semaines. Code propre, SEO carré, animations soignées.",
      en: "Professional Next.js marketing site, shipped in 1-2 weeks. Clean code, SEO-tuned, polished animations.",
      es: "Web profesional desarrollada en Next.js, entregada en 1-2 semanas. Código limpio, SEO ajustado, animaciones cuidadas.",
    },
    priceMin: 800,
    priceMax: 2500,
    durationLabel: { fr: "1-2 semaines", en: "1-2 weeks", es: "1-2 semanas" },
  },
  {
    slug: "ecommerce",
    name: {
      fr: "Boutique e-commerce",
      en: "E-commerce store",
      es: "Tienda e-commerce",
    },
    description: {
      fr: "Boutique Shopify ou e-commerce custom Next.js + Stripe. Multi-devises, abonnements, intégrations.",
      en: "Shopify or custom Next.js + Stripe e-commerce store. Multi-currency, subscriptions, integrations.",
      es: "Tienda Shopify o e-commerce custom Next.js + Stripe. Multi-divisa, suscripciones, integraciones.",
    },
    priceMin: 1500,
    priceMax: 5000,
    durationLabel: { fr: "2-3 semaines", en: "2-3 weeks", es: "2-3 semanas" },
  },
  {
    slug: "shopify",
    name: {
      fr: "Développement Shopify custom",
      en: "Custom Shopify development",
      es: "Desarrollo Shopify custom",
    },
    description: {
      fr: "Apps Shopify, themes custom Liquid, intégrations tierces (ERP, CRM), Hydrogen headless.",
      en: "Shopify apps, custom Liquid themes, third-party integrations (ERP, CRM), Hydrogen headless.",
      es: "Apps Shopify, temas Liquid custom, integraciones de terceros (ERP, CRM), Hydrogen headless.",
    },
    priceMin: 500,
    priceMax: 3000,
    durationLabel: { fr: "1-3 semaines", en: "1-3 weeks", es: "1-3 semanas" },
  },
  {
    slug: "lovable",
    name: {
      fr: "Migration Lovable vers production",
      en: "Lovable to production migration",
      es: "Migración Lovable a producción",
    },
    description: {
      fr: "Migration d'un MVP no-code (Lovable, Bolt, Bubble, V0) vers une stack code propre et scalable Next.js + Supabase.",
      en: "Migration of a no-code MVP (Lovable, Bolt, Bubble, V0) to a clean, scalable Next.js + Supabase code stack.",
      es: "Migración de un MVP no-code (Lovable, Bolt, Bubble, V0) a un stack código limpio y escalable Next.js + Supabase.",
    },
    priceMin: 2000,
    priceMax: 8000,
    durationLabel: { fr: "2-4 semaines", en: "2-4 weeks", es: "2-4 semanas" },
  },
  {
    slug: "saas",
    name: {
      fr: "SaaS MVP",
      en: "SaaS MVP",
      es: "SaaS MVP",
    },
    description: {
      fr: "MVP SaaS complet : auth, billing Stripe, dashboard, multi-tenant, en 4 à 8 semaines. Stack Next.js + Supabase + Stripe.",
      en: "Complete SaaS MVP: auth, Stripe billing, dashboard, multi-tenant, in 4 to 8 weeks. Stack Next.js + Supabase + Stripe.",
      es: "MVP SaaS completo: auth, billing Stripe, dashboard, multi-tenant, en 4 a 8 semanas. Stack Next.js + Supabase + Stripe.",
    },
    priceMin: 5000,
    priceMax: 15000,
    durationLabel: { fr: "4-8 semaines", en: "4-8 weeks", es: "4-8 semanas" },
  },
  {
    slug: "mobile",
    name: {
      fr: "Application mobile",
      en: "Mobile application",
      es: "Aplicación móvil",
    },
    description: {
      fr: "App iOS + Android en React Native + Expo, une seule codebase, soumission App Store + Play Store incluse.",
      en: "iOS + Android app in React Native + Expo, single codebase, App Store + Play Store submission included.",
      es: "App iOS + Android en React Native + Expo, una sola codebase, subida App Store + Play Store incluida.",
    },
    priceMin: 4000,
    priceMax: 12000,
    durationLabel: { fr: "4-8 semaines", en: "4-8 weeks", es: "4-8 semanas" },
  },
];

type FaqItem = { q: string; a: string };

const FAQS: Record<Locale, FaqItem[]> = {
  fr: [
    {
      q: "Combien de temps pour livrer ?",
      a: "1 à 8 semaines selon le projet. Démarrage rapide après signature, demos régulières en cours de route.",
    },
    {
      q: "Vous gérez le copy, le contenu, le design ?",
      a: "Oui en option. On peut s'occuper du copywriting et du design, ou bosser avec ton équipe et tes prestas existants.",
    },
    {
      q: "Le code est à moi ?",
      a: "Toujours. Tu récupères le repo Git, le compte d'hébergement, les comptes services. Aucun lock-in.",
    },
    {
      q: "Quelle stack ?",
      a: "Web : Next.js, TypeScript, Tailwind, Supabase, Stripe, Vercel. Mobile : React Native + Expo. Shopify : Liquid + Hydrogen.",
    },
    {
      q: "Comment on collabore pendant le projet ?",
      a: "Contact direct avec les devs, demos régulières, environnement de preview en continu. Pas de comité, pas de Gantt à 12 niveaux.",
    },
    {
      q: "Et après la mise en ligne ?",
      a: "On reste joignable 14 jours pour les ajustements. Ensuite tu peux signer un contrat de maintenance, ou tu reprends la main, c'est ton code.",
    },
  ],
  en: [
    {
      q: "How long does it take to ship?",
      a: "1 to 8 weeks depending on the project. Fast kickoff after sign-off, regular demos along the way.",
    },
    {
      q: "Do you handle copy, content, and design?",
      a: "Yes on demand. We can take care of copywriting and design, or work alongside your team and existing partners.",
    },
    {
      q: "Do I own the code?",
      a: "Always. You get the Git repo, hosting account, service credentials. No lock-in.",
    },
    {
      q: "What's the stack?",
      a: "Web: Next.js, TypeScript, Tailwind, Supabase, Stripe, Vercel. Mobile: React Native + Expo. Shopify: Liquid + Hydrogen.",
    },
    {
      q: "How do we collaborate during the project?",
      a: "Direct contact with the devs, regular demos, a preview environment that's always live. No committees, no 12-layer Gantt charts.",
    },
    {
      q: "What happens after launch?",
      a: "We stay reachable for 14 days for tweaks. After that you can sign a maintenance contract, or take over, it's your code.",
    },
  ],
  es: [
    {
      q: "¿Cuánto se tarda en entregar?",
      a: "1 a 8 semanas según el proyecto. Arranque rápido tras firma, demos regulares por el camino.",
    },
    {
      q: "¿Os encargáis del copy, contenido y diseño?",
      a: "Sí, opcional. Podemos ocuparnos del copywriting y el diseño, o trabajar junto a tu equipo y partners actuales.",
    },
    {
      q: "¿El código es mío?",
      a: "Siempre. Te llevas el repo Git, la cuenta de hosting, las credenciales de los servicios. Sin lock-in.",
    },
    {
      q: "¿Qué stack usáis?",
      a: "Web: Next.js, TypeScript, Tailwind, Supabase, Stripe, Vercel. Móvil: React Native + Expo. Shopify: Liquid + Hydrogen.",
    },
    {
      q: "¿Cómo colaboramos durante el proyecto?",
      a: "Contacto directo con los devs, demos regulares, entorno de preview siempre activo. Sin comités, sin Gantt de 12 niveles.",
    },
    {
      q: "¿Y después del lanzamiento?",
      a: "Seguimos disponibles 14 días para ajustes. Luego puedes firmar mantenimiento o tomar el control tú mismo, es tu código.",
    },
  ],
};

export function HomeJsonLd({ locale }: { locale: Locale }) {
  const url = SITE_URL;

  const organization = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}#organization`,
    name: "Hulabe",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/opengraph-image`,
    email: "support@hulabe.com",
    priceRange: "€500 – €15 000",
    foundingDate: "2026",
    knowsAbout: [
      "Next.js",
      "TypeScript",
      "React",
      "React Native",
      "Tailwind CSS",
      "Supabase",
      "Stripe",
      "Shopify",
      "Vercel",
      "Prisma",
      "PostgreSQL",
    ],
    serviceArea: { "@type": "AdministrativeArea", name: "Worldwide" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@hulabe.com",
      availableLanguage: ["French", "English", "Spanish"],
      areaServed: "Worldwide",
    },
    sameAs: [],
    description:
      locale === "fr"
        ? "Studio de développement web et mobile. Sites vitrines, e-commerce, SaaS et applications mobiles livrés rapidement avec un code propre. Devis sous 24h, démarrage rapide."
        : locale === "es"
          ? "Estudio de desarrollo web y móvil. Webs, e-commerce, SaaS y aplicaciones móviles entregados rápido con código limpio. Presupuesto en 24h, arranque rápido."
          : "Web and mobile development studio. Marketing sites, e-commerce, SaaS and mobile apps shipped fast with clean code. Quote in 24h, fast kickoff.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: "Hulabe",
    publisher: { "@id": `${SITE_URL}#organization` },
    inLanguage: ["fr", "en", "es"],
  };

  const services = SERVICES.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}#service-${s.slug}`,
    name: s.name[locale],
    description: s.description[locale],
    provider: { "@id": `${SITE_URL}#organization` },
    serviceType: s.name[locale],
    areaServed: { "@type": "AdministrativeArea", name: "Worldwide" },
    termsOfService: `${SITE_URL}/legal/terms`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: s.priceMin,
      highPrice: s.priceMax,
      offerCount: 1,
      availability: "https://schema.org/InStock",
    },
  }));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hulabe", item: url },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}#faq`,
    mainEntity: FAQS[locale].map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website, ...services, breadcrumb, faqPage],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
