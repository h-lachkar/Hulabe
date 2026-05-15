import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findActiveAdminByEmail, hasAnyAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.admin");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already authenticated and active admin → go to dashboard
  if (user?.email) {
    const admin = await findActiveAdminByEmail(user.email);
    if (admin) redirect("/admin");
  }

  const [params, anyAdmin] = await Promise.all([searchParams, hasAnyAdmin()]);
  const t = await getTranslations("auth.admin");
  const errKey = params.error as
    | "not_authorized"
    | "invalid_link"
    | "forbidden"
    | undefined;
  const errorMessage = errKey
    ? (() => {
        try {
          return t(`errors.${errKey}`);
        } catch {
          return t("errors.default");
        }
      })()
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {t("kicker")}
        </div>
        <h1 className="display text-3xl">{t("heading")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subheading")}</p>

        {!anyAdmin && (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            <p className="font-mono uppercase tracking-wider">{t("setupNeededTitle")}</p>
            <p className="mt-2 leading-relaxed">
              {t.rich("setupNeededBody", {
                file: () => <code className="rounded bg-bg/50 px-1">SETUP.md</code>,
              })}
            </p>
          </div>
        )}

        <div className="mt-8">
          <LoginForm errorMessage={errorMessage} />
        </div>
      </div>
    </div>
  );
}
