import { getLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Process } from "@/components/sections/process";
import { Simulator } from "@/components/sections/simulator";
// Cases section hidden for now — no public case studies ready to show.
// Re-enable by restoring the import + <CaseStudies /> below + the nav link
// in src/components/layout/header.tsx.
// import { CaseStudies } from "@/components/sections/case-studies";
import { Faq } from "@/components/sections/faq";
import { Contact } from "@/components/sections/contact";
import { StackTicker } from "@/components/stack-ticker";
import { HomeJsonLd } from "@/components/json-ld";
import type { Locale } from "@/i18n/routing";

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;

  return (
    <>
      <HomeJsonLd locale={locale} />
      <Hero />
      <Services />
      <Simulator />
      <Process />
      <StackTicker />
      {/* <CaseStudies /> — hidden, no public cases ready yet */}
      <Faq />
      <Contact />
    </>
  );
}
