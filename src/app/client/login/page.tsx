import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { findActiveAdminByEmail } from "@/lib/admin/auth";
import { ClientLoginForm } from "./login-form";

export const metadata = {
  title: "Espace client · Hulabe",
  robots: { index: false, follow: false },
};

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          HULABE / ESPACE CLIENT
        </div>
        <h1 className="display text-3xl">Bienvenue.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre l&apos;email que tu as utilisé pour ton projet et ton mot de passe. Si
          c&apos;est ta première connexion ou si tu as oublié ton mot de passe, utilise
          le lien sous le formulaire.
        </p>

        <div className="mt-8">
          <ClientLoginForm
            errorMessage={
              params.error === "not_authorized"
                ? "Aucun projet trouvé pour cet email. Si tu penses que c'est une erreur, écris à support@hulabe.com."
                : params.error === "invalid_link"
                  ? "Lien expiré ou invalide. Demande un nouveau lien."
                  : null
            }
          />
        </div>
      </div>
    </div>
  );
}
