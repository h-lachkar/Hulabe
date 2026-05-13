import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/middleware";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin · Hulabe",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already authenticated as admin → go to dashboard
  if (user && isAdminEmail(user.email)) redirect("/admin");

  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          HULABE / ADMIN
        </div>
        <h1 className="display text-3xl">Sign in.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Magic link envoyé sur ton email. Seuls les emails listés dans{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">ADMIN_EMAILS</code>{" "}
          sont acceptés.
        </p>

        <div className="mt-8">
          <LoginForm
            errorParam={params.error}
            sent={params.sent === "1"}
          />
        </div>
      </div>
    </div>
  );
}
