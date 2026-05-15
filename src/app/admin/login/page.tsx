import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findActiveAdminByEmail, hasAnyAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin · Hulabe",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized:
    "Cet email n'est pas autorisé à accéder à l'admin. Demande à un owner de t'inviter.",
  invalid_link: "Lien expiré ou invalide. Demande un nouveau magic link.",
  forbidden: "Ton rôle ne donne pas accès à cette page.",
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

  // Already authenticated and active admin → go to dashboard
  if (user?.email) {
    const admin = await findActiveAdminByEmail(user.email);
    if (admin) redirect("/admin");
  }

  const [params, anyAdmin] = await Promise.all([searchParams, hasAnyAdmin()]);
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? "Erreur d'authentification."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          HULABE / ADMIN
        </div>
        <h1 className="display text-3xl">Sign in.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre ton email et ton mot de passe. Si c&apos;est ta première connexion ou si
          tu as oublié ton mot de passe, utilise le lien sous le formulaire.
        </p>

        {!anyAdmin && (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            <p className="font-mono uppercase tracking-wider">Setup nécessaire</p>
            <p className="mt-2 leading-relaxed">
              Aucun admin n&apos;est encore créé. Crée le premier OWNER en SQL direct sur
              Supabase — voir <code className="rounded bg-bg/50 px-1">SETUP.md §5</code>.
              Puis utilise &laquo;&nbsp;Première connexion&nbsp;?&nbsp;&raquo; ci-dessous pour
              définir ton mot de passe.
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
