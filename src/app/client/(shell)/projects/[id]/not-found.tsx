import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Folders } from "lucide-react";

export default async function ProjectNotFound() {
  const t = await getTranslations("clientPortal.project.notFound");
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Folders className="mx-auto h-6 w-6 text-muted-2" />
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {t("code")}
      </p>
      <h1 className="mt-2 display text-3xl">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("body")}</p>
      <Link
        href="/client"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-semibold text-bg hover:bg-lime-dark"
      >
        {t("back")}
      </Link>
    </div>
  );
}
