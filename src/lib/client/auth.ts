import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Cached per render tree to avoid repeated supabase.auth.getUser() calls. */
const resolveClientUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Use inside any /client server component or server action.
 * Redirects to /client/login if not authenticated. Returns the Supabase user.
 *
 * Note: this does NOT enforce per-project ownership.
 * Use `getClientProject(id, email)` to fetch a project safely.
 */
export async function requireClient() {
  const user = await resolveClientUser();
  if (!user || !user.email) redirect("/client/login");

  // Force the user to set a real password if they only have an OTP session
  // (from invite or recovery email).
  const passwordSetAt = user.user_metadata?.passwordSetAt;
  if (!passwordSetAt) {
    redirect("/client/setup-password");
  }

  return user;
}

export async function getClientUser() {
  const user = await resolveClientUser();
  if (!user || !user.email) return null;
  return user;
}

/**
 * Returns all projects this client can access via the portal. A project is
 * accessible when EITHER:
 *   1. The User has an explicit ProjectMember row (preferred), OR
 *   2. The project's lead.email matches the client's email (legacy fallback
 *      for projects created before the explicit-link feature shipped).
 *
 * Case-insensitive on email.
 */
export async function getClientProjects(email: string) {
  const lower = email.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: lower, mode: "insensitive" }, role: "CLIENT" },
    select: { id: true },
  });
  return prisma.project.findMany({
    where: {
      OR: [
        ...(user ? [{ members: { some: { userId: user.id } } }] : []),
        { lead: { email: lower } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      lead: { select: { name: true, email: true } },
      _count: {
        select: {
          deliverables: { where: { visibleToClient: true } },
          supportRequests: true,
        },
      },
    },
  });
}

/**
 * Fetch a project AND verify the client has access to it. Access via either
 * the explicit ProjectMember link OR the legacy lead.email match.
 * Returns null if not found / not accessible.
 */
export async function getClientProject(projectId: string, email: string) {
  const lower = email.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: lower, mode: "insensitive" }, role: "CLIENT" },
    select: { id: true },
  });
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        ...(user ? [{ members: { some: { userId: user.id } } }] : []),
        { lead: { email: lower } },
      ],
    },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      deliverables: {
        where: { visibleToClient: true },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        where: { visibleToClient: true },
        orderBy: { createdAt: "desc" },
      },
      supportRequests: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        where: {
          kind: {
            in: [
              "PROJECT_CREATED",
              "PROJECT_STATUS_CHANGED",
              "DELIVERABLE_ADDED",
              "SUPPORT_REQUEST_OPENED",
              "SUPPORT_REQUEST_RESOLVED",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });
  return project;
}

/**
 * True if the project is currently in its 14-day support window
 * (i.e. shippedAt set, supportEndsAt in the future).
 */
export function isInSupportWindow(supportEndsAt: Date | null) {
  if (!supportEndsAt) return false;
  return supportEndsAt.getTime() > Date.now();
}
