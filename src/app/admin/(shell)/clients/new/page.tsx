import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMutator } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { ClientCreateForm } from "@/components/admin/client-create-form";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  await requireMutator();
  const t = await getTranslations("admin.clients");

  return (
    <>
      <PageHeader
        kicker={t("kicker")}
        title={t("new.title")}
        subtitle={t("new.subtitle")}
        actions={
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToList")}
          </Link>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <ClientCreateForm />
      </div>
    </>
  );
}
