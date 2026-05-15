import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Layout applied to every admin route that lives "inside" the shell
 * (dashboard, leads, projects, team, settings, support, invoices, ...).
 *
 * Login + setup-password are intentionally OUTSIDE this group so the user
 * can't navigate away while in those states.
 *
 * Calling requireAdmin() here also forces the password-set gate: if the
 * admin has never set their password, they're bounced to /admin/setup-password.
 */
export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();
  return (
    <AdminShell
      userEmail={ctx.admin.email}
      userName={ctx.admin.name}
      userRole={ctx.admin.role}
    >
      {children}
    </AdminShell>
  );
}
