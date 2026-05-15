import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SetupPasswordForm } from "@/components/auth/setup-password-form";
import { findActiveAdminByEmail } from "@/lib/admin/auth";

export async function generateMetadata() {
  const t = await getTranslations("auth.admin.setupPassword");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminSetupPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be signed in (via invite/recovery link)
  if (!user?.email) redirect("/admin/login");

  // Must be a registered admin
  const admin = await findActiveAdminByEmail(user.email);
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  const ta = await getTranslations("auth.admin");
  const ts = await getTranslations("auth.admin.setupPassword");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {ta("kicker")}
        </div>
        <h1 className="display text-3xl">
          {ts("heading")}
          <span className="text-lime">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ts("subheading", { email: user.email })}
        </p>
        <div className="mt-8">
          <SetupPasswordForm successRedirect="/admin" />
        </div>
      </div>
    </div>
  );
}
