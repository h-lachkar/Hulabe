import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.admin.setupPassword");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Setup-password lives "outside" the admin shell — no sidebar, no nav, nothing
 * but the form. The user MUST set a password before accessing the rest of the
 * admin (enforced by requireAdmin in src/lib/admin/auth.ts).
 *
 * This layout replaces the parent admin shell layout for this route only.
 */
export default function AdminSetupPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
