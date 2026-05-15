import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SetupPasswordForm } from "@/components/auth/setup-password-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.client.setupPassword");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

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

  const tc = await getTranslations("auth.client");
  const ts = await getTranslations("auth.client.setupPassword");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {tc("kicker")}
        </div>
        <h1 className="display text-3xl">
          {lead.name ? ts("headingGreeting", { name: lead.name }) : ts("headingWelcome")}
          <span className="text-lime">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{ts("subheading")}</p>
        <div className="mt-8">
          <SetupPasswordForm successRedirect="/client" />
        </div>
      </div>
    </div>
  );
}
