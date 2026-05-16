import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Roles that count as "internal team members" (non-client). */
const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN", "VIEWER"];

export type AdminContext = {
  /** Supabase user (auth session). */
  user: {
    id: string;
    email: string;
  };
  /** Hulabe User row from DB — source of truth for permissions.
   *  Kept named `admin` for backwards compat with calling code. */
  admin: User;
};

/** Lookup an active internal user (OWNER/ADMIN/VIEWER) by email. */
export async function findActiveAdminByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      role: { in: ADMIN_ROLES },
      isActive: true,
    },
  });
}

/**
 * Cached per React render tree: resolves the Supabase user + Hulabe User row
 * once, even when called from layout + page + nested server components.
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
 * - Redirects to /admin/login?error=not_authorized if email is not an active
 *   internal user (OWNER / ADMIN / VIEWER)
 * - Optionally requires one of the given roles
 */
export async function requireAdmin(
  allowedRoles?: UserRole[],
): Promise<AdminContext> {
  const { user, admin } = await resolveAdmin();

  if (!user || !user.email) redirect("/admin/login");

  if (!admin) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  if (!admin.passwordSetAt) {
    redirect("/admin/setup-password");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    redirect("/admin?error=forbidden");
  }

  // Best-effort lastLoginAt refresh (max every 60 s)
  const now = Date.now();
  const last = admin.lastLoginAt?.getTime() ?? 0;
  if (now - last > 60_000) {
    prisma.user
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

export async function getAdminContext(): Promise<AdminContext | null> {
  const { user, admin } = await resolveAdmin();
  if (!user || !user.email || !admin) return null;
  return { user: { id: user.id, email: user.email }, admin };
}

/** True if role can mutate (i.e. not just read). */
export function canMutate(role: UserRole) {
  return role === "OWNER" || role === "ADMIN";
}

export async function requireMutator(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!canMutate(ctx.admin.role)) {
    throw new Error("Read-only role: this action requires ADMIN or OWNER.");
  }
  return ctx;
}

export async function requireOwner(): Promise<AdminContext> {
  return requireAdmin(["OWNER"]);
}

/* ------------------------------- Bootstrap ------------------------------- */

/** Returns true when at least one internal user exists. */
export async function hasAnyAdmin() {
  const count = await prisma.user.count({
    where: { role: { in: ADMIN_ROLES } },
  });
  return count > 0;
}
