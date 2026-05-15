import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { findActiveAdminByEmail } from "@/lib/admin/auth";
import { ClientLoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.client");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    // Admins go to admin, clients go to /client
    const admin = await findActiveAdminByEmail(user.email);
    if (admin) redirect("/admin");
    const hasProject = await prisma.lead.findFirst({
      where: { email: user.email.toLowerCase(), projects: { some: {} } },
      select: { id: true },
    });
    if (hasProject) redirect("/client");
  }

  const params = await searchParams;
  const tc = await getTranslations("auth.client");
  const errorMessage =
    params.error === "not_authorized"
      ? tc("errors.not_authorized")
      : params.error === "invalid_link"
        ? tc("errors.invalid_link")
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {tc("kicker")}
        </div>
        <h1 className="display text-3xl">{tc("heading")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tc("subheading")}</p>

        <div className="mt-8">
          <ClientLoginForm errorMessage={errorMessage} />
        </div>
      </div>
    </div>
  );
}
