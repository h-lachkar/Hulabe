import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Use inside any /client server component or server action.
 * Redirects to /client/login if not authenticated. Returns the user.
 *
 * Note: this does NOT enforce per-project ownership.
 * Use `getClientProject(id, email)` to fetch a project safely.
 */
export async function requireClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/client/login");
  return user;
}

export async function getClientUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;
  return user;
}

/**
 * Returns all projects owned by leads whose email matches the client's email.
 * (Case-insensitive on email.)
 */
export async function getClientProjects(email: string) {
  return prisma.project.findMany({
    where: {
      lead: { email: email.toLowerCase() },
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
 * Fetch a project AND verify it belongs to the given client email.
 * Returns null if not found / not owned by this client.
 */
export async function getClientProject(projectId: string, email: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      lead: { email: email.toLowerCase() },
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
        // Only client-visible activity kinds
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
