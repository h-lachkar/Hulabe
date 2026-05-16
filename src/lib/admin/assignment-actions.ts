"use server";

import { revalidatePath } from "next/cache";
import { AdminScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMutator, requireOwner } from "@/lib/admin/auth";

export type AssignmentResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/* -------------------------- Project ↔ User ----------------------------- */

/**
 * Add a User as a member of a Project. Same call works for clients and admins
 * — the role is already on the User row. CLIENT membership grants portal
 * access; ADMIN/VIEWER membership is consulted when their accessScope=ASSIGNED.
 */
async function upsertMember(projectId: string, userId: string, addedById: string) {
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, addedById },
    update: {},
  });
}

export async function assignClientToProject(formData: FormData): Promise<AssignmentResult> {
  const ctx = await requireMutator();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!projectId || !clientId) {
    return { ok: false, error: "projectId and clientId are required" };
  }
  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, role: true },
    }),
  ]);
  if (!project || !user) return { ok: false, error: "Project or client not found" };
  if (user.role !== "CLIENT") {
    return { ok: false, error: "User is not a CLIENT" };
  }
  await upsertMember(projectId, clientId, ctx.admin.id);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

export async function unassignClientFromProject(formData: FormData): Promise<AssignmentResult> {
  await requireMutator();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!projectId || !clientId) {
    return { ok: false, error: "projectId and clientId are required" };
  }
  await prisma.projectMember.deleteMany({ where: { projectId, userId: clientId } });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

export async function assignAdminToProject(formData: FormData): Promise<AssignmentResult> {
  const ctx = await requireOwner();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const adminId = String(formData.get("adminId") ?? "").trim();
  if (!projectId || !adminId) {
    return { ok: false, error: "projectId and adminId are required" };
  }
  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    }),
  ]);
  if (!project || !user) return { ok: false, error: "Project or admin not found" };
  if (user.role === "CLIENT") {
    return { ok: false, error: "User is not an admin" };
  }
  await upsertMember(projectId, adminId, ctx.admin.id);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/team`);
  return { ok: true };
}

export async function unassignAdminFromProject(formData: FormData): Promise<AssignmentResult> {
  await requireOwner();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const adminId = String(formData.get("adminId") ?? "").trim();
  if (!projectId || !adminId) {
    return { ok: false, error: "projectId and adminId are required" };
  }
  await prisma.projectMember.deleteMany({ where: { projectId, userId: adminId } });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/team`);
  return { ok: true };
}

/* ----------------------- Admin access scope ---------------------------- */

export async function setAdminAccessScope(formData: FormData): Promise<AssignmentResult> {
  await requireOwner();
  const adminId = String(formData.get("adminId") ?? "").trim();
  const scopeRaw = String(formData.get("scope") ?? "") as AdminScope;
  if (!adminId || !["ALL", "ASSIGNED"].includes(scopeRaw)) {
    return { ok: false, error: "Invalid scope" };
  }
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return { ok: false, error: "Admin not found" };
  if (admin.role === "OWNER" && scopeRaw === "ASSIGNED") {
    return { ok: false, error: "OWNER role always has ALL access scope." };
  }
  if (admin.role === "CLIENT") {
    return { ok: false, error: "Cannot set access scope on a CLIENT user." };
  }
  await prisma.user.update({
    where: { id: adminId },
    data: { accessScope: scopeRaw },
  });
  revalidatePath("/admin/team");
  return { ok: true };
}
