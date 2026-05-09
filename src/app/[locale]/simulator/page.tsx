import { setRequestLocale } from "next-intl/server";
import { Simulator } from "@/components/sections/simulator";

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
