"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import {
  ActivityKind,
  LeadStatus,
  ProjectStatus,
  type ServiceType,
} from "@prisma/client";

/* -------------------------------- Helpers ------------------------------- */

async function logActivity(args: {
  kind: ActivityKind;
  summary: string;
  metadata?: Record<string, unknown>;
  authorId: string;
  authorEmail: string;
  leadId?: string;
  projectId?: string;
}) {
  await prisma.activity.create({
    data: {
      kind: args.kind,
      summary: args.summary,
      metadata: args.metadata ? (args.metadata as object) : undefined,
      authorId: args.authorId,
      authorEmail: args.authorEmail,
      leadId: args.leadId,
      projectId: args.projectId,
    },
  });
}

/* --------------------------------- Lead --------------------------------- */

export async function updateLeadStatus(formData: FormData) {
  const user = await requireAdmin();
  const leadId = formData.get("leadId") as string;
  const status = formData.get("status") as LeadStatus;

  if (!leadId || !status) return;

  const previous = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!previous) return;

  await prisma.lead.update({ where: { id: leadId }, data: { status } });

  await logActivity({
    kind: ActivityKind.LEAD_STATUS_CHANGED,
    summary: `Status: ${previous.status} → ${status}`,
    metadata: { from: previous.status, to: status },
    authorId: user.id,
    authorEmail: user.email ?? "",
    leadId,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
}

export async function addLeadNote(formData: FormData) {
  const user = await requireAdmin();
  const leadId = formData.get("leadId") as string;
  const body = (formData.get("body") as string)?.trim();
  if (!leadId || !body) return;

  const note = await prisma.note.create({
    data: {
      leadId,
      body,
      authorId: user.id,
      authorEmail: user.email ?? "",
    },
  });

  await logActivity({
    kind: ActivityKind.LEAD_NOTE_ADDED,
    summary: body.slice(0, 80) + (body.length > 80 ? "…" : ""),
    metadata: { noteId: note.id },
    authorId: user.id,
    authorEmail: user.email ?? "",
    leadId,
  });

  revalidatePath(`/admin/leads/${leadId}`);
}

/* ------------------------------ Project --------------------------------- */

export async function createProjectFromLead(formData: FormData) {
  const user = await requireAdmin();
  const leadId = formData.get("leadId") as string;
  const name = (formData.get("name") as string)?.trim();
  const serviceType = formData.get("serviceType") as ServiceType | null;

  if (!leadId || !name) return;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const project = await prisma.project.create({
    data: {
      name,
      leadId,
      serviceType: serviceType ?? lead.serviceType ?? null,
      status: ProjectStatus.DRAFT,
      priceQuotedCents:
        lead.estimatedPriceMin != null && lead.estimatedPriceMax != null
          ? Math.round(((lead.estimatedPriceMin + lead.estimatedPriceMax) / 2) * 100)
          : null,
    },
  });

  // Mark lead as won when project is created (admin can revert)
  if (lead.status !== LeadStatus.WON) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.WON },
    });
  }

  await logActivity({
    kind: ActivityKind.PROJECT_CREATED,
    summary: `Project "${name}" créé`,
    metadata: { projectId: project.id, leadId },
    authorId: user.id,
    authorEmail: user.email ?? "",
    leadId,
    projectId: project.id,
  });

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const user = await requireAdmin();
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as ProjectStatus;
  if (!projectId || !status) return;

  const previous = await prisma.project.findUnique({ where: { id: projectId } });
  if (!previous) return;

  // When SHIPPED, set shippedAt + supportEndsAt (14 days)
  const data: {
    status: ProjectStatus;
    shippedAt?: Date;
    supportEndsAt?: Date;
    startedAt?: Date;
  } = { status };
  if (status === ProjectStatus.SHIPPED && !previous.shippedAt) {
    const now = new Date();
    data.shippedAt = now;
    data.supportEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  if (status === ProjectStatus.IN_PROGRESS && !previous.startedAt) {
    data.startedAt = new Date();
  }

  await prisma.project.update({ where: { id: projectId }, data });

  await logActivity({
    kind: ActivityKind.PROJECT_STATUS_CHANGED,
    summary: `Status: ${previous.status} → ${status}`,
    metadata: { from: previous.status, to: status },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: previous.leadId ?? undefined,
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

export async function addProjectNote(formData: FormData) {
  const user = await requireAdmin();
  const projectId = formData.get("projectId") as string;
  const body = (formData.get("body") as string)?.trim();
  const visibleToClient = formData.get("visibleToClient") === "on";
  if (!projectId || !body) return;

  const note = await prisma.note.create({
    data: {
      projectId,
      body,
      visibleToClient,
      authorId: user.id,
      authorEmail: user.email ?? "",
    },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  await logActivity({
    kind: ActivityKind.PROJECT_NOTE_ADDED,
    summary: body.slice(0, 80) + (body.length > 80 ? "…" : ""),
    metadata: { noteId: note.id, visibleToClient },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: project?.leadId ?? undefined,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addDeliverable(formData: FormData) {
  const user = await requireAdmin();
  const projectId = formData.get("projectId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const kind = (formData.get("kind") as string) || "LINK";
  if (!projectId || !title) return;

  const deliverable = await prisma.deliverable.create({
    data: {
      projectId,
      title,
      description,
      url,
      kind: kind as "LINK" | "REPO" | "DEPLOYMENT" | "DESIGN" | "DOC" | "FILE",
      visibleToClient: true,
      deliveredAt: new Date(),
    },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  await logActivity({
    kind: ActivityKind.DELIVERABLE_ADDED,
    summary: `Livrable ajouté: ${title}`,
    metadata: { deliverableId: deliverable.id },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: project?.leadId ?? undefined,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}
