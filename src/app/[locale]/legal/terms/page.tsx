import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return (
    <article className="container-page max-w-3xl py-20">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t("lastUpdated")}: 2026-01-01
      </p>
      <h1 className="display mt-3 text-4xl">{t("title")}</h1>
      <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Hulabe est exploité par Hugo Lecker (auto-entrepreneur, Paris). Les prestations sont
          encadrées par un devis signé par les deux parties avant tout démarrage.
        </p>
        <p>
          Paiement : 30% à la signature, 30% à mi-projet, 40% à la livraison. Délais et livrables
          sont précisés au devis. Le code livré devient propriété du client après règlement
          intégral.
        </p>
        <p>
          Pour toute question :{" "}
          <a className="text-lime hover:underline" href="mailto:support@hulabe.com">
            support@hulabe.com
          </a>
          .
        </p>
      </div>
    </article>
  );
}
