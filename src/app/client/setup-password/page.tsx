import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SetupPasswordForm } from "@/components/auth/setup-password-form";

export const metadata = {
  title: "Définir mon mot de passe · Hulabe",
  robots: { index: false, follow: false },
};

export default async function ClientSetupPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/client/login");

  // Must be a lead with at least one project
  const lead = await prisma.lead.findFirst({
    where: {
      email: { equals: user.email, mode: "insensitive" },
      projects: { some: {} },
    },
    select: { name: true },
  });
  if (!lead) {
    await supabase.auth.signOut();
    redirect("/client/login?error=not_authorized");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          HULABE / ESPACE CLIENT
        </div>
        <h1 className="display text-3xl">
          {lead.name ? `Salut ${lead.name}` : "Bienvenue"}
          <span className="text-lime">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisis ton mot de passe pour accéder à ton espace.
        </p>
        <div className="mt-8">
          <SetupPasswordForm successRedirect="/client" />
        </div>
      </div>
    </div>
  );
}
