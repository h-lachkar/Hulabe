import type { User, Prisma } from "@prisma/client";

/**
 * Returns a Prisma `where` fragment for filtering projects an admin is
 * allowed to see, based on their access scope.
 *
 *   - OWNER or `accessScope = ALL`  → no filter (sees everything)
 *   - `accessScope = ASSIGNED`      → only projects in ProjectMember for them
 */
export function projectAccessWhere(
  admin: Pick<User, "id" | "role" | "accessScope">,
): Prisma.ProjectWhereInput {
  if (admin.role === "OWNER" || admin.accessScope === "ALL") return {};
  return { members: { some: { userId: admin.id } } };
}

/**
 * True when the given admin is allowed to access the given project.
 * Use as a defensive gate on /admin/projects/[id].
 */
export async function canAdminAccessProject(
  admin: Pick<User, "id" | "role" | "accessScope">,
  projectId: string,
  prisma: import("@prisma/client").PrismaClient,
): Promise<boolean> {
  if (admin.role === "OWNER" || admin.accessScope === "ALL") return true;
  const link = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: admin.id } },
    select: { projectId: true },
  });
  return link != null;
}
