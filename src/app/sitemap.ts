import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

const ROUTES = ["", "simulator", "legal/privacy", "legal/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ROUTES.flatMap((route) => {
    return routing.locales.map((locale) => {
      const path =
        locale === routing.defaultLocale
          ? route === ""
            ? ""
            : `/${route}`
          : route === ""
            ? `/${locale}`
            : `/${locale}/${route}`;

      // Build alternate languages map
      const alternates = Object.fromEntries(
        routing.locales.map((l) => {
          const alt =
            l === routing.defaultLocale
              ? route === ""
                ? ""
                : `/${route}`
              : route === ""
                ? `/${l}`
                : `/${l}/${route}`;
          return [l, `${SITE_URL}${alt}`];
        }),
      );

      return {
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
        priority: route === "" ? 1 : route === "simulator" ? 0.9 : 0.5,
        alternates: { languages: alternates },
      };
    });
  });
}
