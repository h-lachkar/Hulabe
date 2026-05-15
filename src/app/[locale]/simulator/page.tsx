import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Simulator } from "@/components/sections/simulator";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "simulator" });
  const canonicalPath =
    locale === routing.defaultLocale ? "/simulator" : `/${locale}/simulator`;

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === routing.defaultLocale ? "/simulator" : `/${l}/simulator`,
        ]),
      ),
    },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: canonicalPath,
      type: "website",
    },
  };
}

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="pt-8">
      <Simulator />
    </div>
  );
}
