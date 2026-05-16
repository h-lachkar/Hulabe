import { cache } from "react";
import { redirect } from "next/navigation";
import type { AdminRole, AdminUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminContext = {
  /** Supabase user (auth session). */
  user: {
    id: string;
    email: string;
  };
  /** Hulabe admin row from DB — source of truth for permissions. */
  admin: AdminUser;
};

/** Lookup an active AdminUser by email (case-insensitive). */
export async function findActiveAdminByEmail(email: string) {
  return prisma.adminUser.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      isActive: true,
    },
  });
}

/**
 * Cached per React render tree: resolves the Supabase user + AdminUser once,
 * even when called from layout + page + nested server components.
 * Cuts auth round-trips from 2-3 per nav to 1.
 */
const resolveAdmin = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { user: null, admin: null };

  const admin = await findActiveAdminByEmail(user.email);
  return { user, admin };
});

/**
 * Use inside any /admin server component or server action.
 * - Redirects to /admin/login if not authenticated
 * - Redirects to /admin/login?error=not_authorized if email is not an active AdminUser
 * - Updates lastLoginAt opportunistically
 * - Optionally requires one of the given roles (default = any active admin)
 */
export async function requireAdmin(
  allowedRoles?: AdminRole[],
): Promise<AdminContext> {
  const { user, admin } = await resolveAdmin();

  if (!user || !user.email) redirect("/admin/login");

  if (!admin) {
    // Force sign-out — they have a valid Supabase session but no AdminUser entry.
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  // Force the user to set a password on first login (or after a reset).
  // Without this gate they could navigate the shell with only an OTP session,
  // which is a poor security & UX state.
  if (!admin.passwordSetAt) {
    redirect("/admin/setup-password");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    redirect("/admin?error=forbidden");
  }

  // Best-effort lastLoginAt refresh (max every 60 s — avoid hammering writes).
  const now = Date.now();
  const last = admin.lastLoginAt?.getTime() ?? 0;
  if (now - last > 60_000) {
    prisma.adminUser
      .update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(() => {
        /* non-fatal */
      });
  }

  return {
    user: { id: user.id, email: user.email },
    admin,
  };
}

/** Like requireAdmin but returns null instead of redirecting (use for layouts). */
export async function getAdminContext(): Promise<AdminContext | null> {
  const { user, admin } = await resolveAdmin();
  if (!user || !user.email || !admin) return null;
  return { user: { id: user.id, email: user.email }, admin };
}

/** True if role can mutate (i.e. not just read). */
export function canMutate(role: AdminRole) {
  return role === "OWNER" || role === "ADMIN";
}

/** Ensure the current admin can mutate; throw otherwise. */
export async function requireMutator(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!canMutate(ctx.admin.role)) {
    throw new Error("Read-only role: this action requires ADMIN or OWNER.");
  }
  return ctx;
}

/** Ensure the current admin is OWNER (for /admin/team operations). */
export async function requireOwner(): Promise<AdminContext> {
  return requireAdmin(["OWNER"]);
}

/* ------------------------------- Bootstrap ------------------------------- */

/**
 * Returns true when at least one AdminUser exists (any role, active or not).
 * Used by /admin/login to show a helpful empty-state message.
 */
export async function hasAnyAdmin() {
  const count = await prisma.adminUser.count();
  return count > 0;
}
