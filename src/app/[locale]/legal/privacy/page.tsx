import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return (
    <article className="container-page max-w-3xl py-20 prose prose-invert">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t("lastUpdated")}: 2026-05-09
      </p>
      <h1 className="display mt-3 text-4xl">{t("title")}</h1>

      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Données collectées via les formulaires
          </h2>
          <p>
            Hulabe collecte uniquement les informations que tu fournis volontairement via
            les formulaires du site (nom, email, téléphone, message, données du simulateur).
            Ces informations servent uniquement à te recontacter dans le cadre de ta demande.
            Données stockées chez Supabase (UE). Emails envoyés via Resend. Aucune revente,
            aucun partage avec des tiers à des fins marketing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Analytics & enregistrements de session
          </h2>
          <p>
            On utilise <strong>PostHog</strong> (instance EU) pour comprendre comment les
            visiteurs utilisent le site : pages vues, clics, défilement, et enregistrements
            de session. Les enregistrements sont anonymisés — les contenus saisis dans les
            formulaires (email, nom, téléphone, message) sont automatiquement masqués et
            ne sont jamais capturés.
          </p>
          <p>
            Si tu veux qu&apos;on n&apos;enregistre pas ta session, tu peux activer le mode &laquo;
            Do Not Track &raquo; dans ton navigateur ou nous écrire à{" "}
            <a className="text-lime hover:underline" href="mailto:support@hulabe.com">
              support@hulabe.com
            </a>{" "}
            pour qu&apos;on supprime tes données.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Tes droits</h2>
          <p>
            Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de
            rectification, de suppression et de portabilité de tes données. Pour exercer
            ces droits, écris à{" "}
            <a className="text-lime hover:underline" href="mailto:support@hulabe.com">
              support@hulabe.com
            </a>
            . On répond sous 30 jours.
          </p>
        </section>
      </div>
    </article>
  );
}
