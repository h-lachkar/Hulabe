import type { Locale } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

type Service = {
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  priceMin: number;
  priceMax: number;
};

const SERVICES: Service[] = [
  {
    name: {
      fr: "Site vitrine",
      en: "Marketing site",
      es: "Web corporativa",
    },
    description: {
      fr: "Site web professionnel développé en Next.js, livré en 1-2 semaines.",
      en: "Professional Next.js marketing site, shipped in 1-2 weeks.",
      es: "Web profesional desarrollada en Next.js, entregada en 1-2 semanas.",
    },
    priceMin: 800,
    priceMax: 2500,
  },
  {
    name: {
      fr: "Boutique e-commerce",
      en: "E-commerce store",
      es: "Tienda e-commerce",
    },
    description: {
      fr: "Boutique Shopify ou e-commerce custom Next.js + Stripe.",
      en: "Shopify or custom Next.js + Stripe e-commerce store.",
      es: "Tienda Shopify o e-commerce custom Next.js + Stripe.",
    },
    priceMin: 1500,
    priceMax: 5000,
  },
  {
    name: {
      fr: "Développement Shopify custom",
      en: "Custom Shopify development",
      es: "Desarrollo Shopify custom",
    },
    description: {
      fr: "Apps Shopify, themes custom Liquid, intégrations tierces.",
      en: "Shopify apps, custom Liquid themes, third-party integrations.",
      es: "Apps Shopify, temas Liquid custom, integraciones de terceros.",
    },
    priceMin: 500,
    priceMax: 3000,
  },
  {
    name: {
      fr: "Migration Lovable vers production",
      en: "Lovable to production migration",
      es: "Migración Lovable a producción",
    },
    description: {
      fr: "Migration d'un MVP no-code vers une stack code propre et scalable.",
      en: "Migration of a no-code MVP to a clean, scalable code stack.",
      es: "Migración de un MVP no-code a un stack código limpio y escalable.",
    },
    priceMin: 2000,
    priceMax: 8000,
  },
  {
    name: {
      fr: "SaaS MVP",
      en: "SaaS MVP",
      es: "SaaS MVP",
    },
    description: {
      fr: "MVP SaaS complet : auth, billing Stripe, dashboard, en 4 à 8 semaines.",
      en: "Complete SaaS MVP: auth, Stripe billing, dashboard, in 4 to 8 weeks.",
      es: "MVP SaaS completo: auth, billing Stripe, dashboard, en 4 a 8 semanas.",
    },
    priceMin: 5000,
    priceMax: 15000,
  },
  {
    name: {
      fr: "Application mobile",
      en: "Mobile application",
      es: "Aplicación móvil",
    },
    description: {
      fr: "App iOS + Android en React Native + Expo, une seule codebase.",
      en: "iOS + Android app in React Native + Expo, single codebase.",
      es: "App iOS + Android en React Native + Expo, una sola codebase.",
    },
    priceMin: 4000,
    priceMax: 12000,
  },
];

export function HomeJsonLd({ locale }: { locale: Locale }) {
  const url = locale === "fr" ? SITE_URL : `${SITE_URL}/${locale}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: "Hulabe",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    email: "support@hulabe.com",
    sameAs: [],
    description:
      locale === "fr"
        ? "Studio de développement web et mobile. Sites vitrines, e-commerce, SaaS et applications mobiles livrés rapidement avec un code propre."
        : locale === "es"
          ? "Estudio de desarrollo web y móvil. Webs, e-commerce, SaaS y aplicaciones móviles entregados rápido con código limpio."
          : "Web and mobile development studio. Marketing sites, e-commerce, SaaS and mobile apps shipped fast with clean code.",
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

  const services = SERVICES.map((s, idx) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}#service-${idx}`,
    name: s.name[locale],
    description: s.description[locale],
    provider: { "@id": `${SITE_URL}#organization` },
    areaServed: { "@type": "Place", name: "Worldwide" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: s.priceMin,
      highPrice: s.priceMax,
      offerCount: 1,
    },
  }));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hulabe", item: url },
    ],
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website, ...services, breadcrumb],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
