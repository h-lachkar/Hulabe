import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Simulator } from "@/components/sections/simulator";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "simulator" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/simulator" },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: "/simulator",
      type: "website",
    },
  };
}

export default async function SimulatorPage() {
  return (
    <div className="pt-8">
      <Simulator />
    </div>
  );
}
