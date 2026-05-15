"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireMutator } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendClientPortalInvitation,
  sendProjectStatusUpdate,
  sendDeliverableAdded,
  sendClientNote,
  sendSupportReplyToClient,
} from "@/lib/resend";
import { scoreAndSaveLead } from "@/lib/ai/score-and-save";
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
  const { user } = await requireMutator();
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
  const { user } = await requireMutator();
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
  const { user } = await requireMutator();
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
  const { user } = await requireMutator();
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as ProjectStatus;
  const notify = formData.get("notify") !== "off"; // notify by default
  if (!projectId || !status) return;

  const previous = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: { select: { email: true, name: true } } },
  });
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
    metadata: { from: previous.status, to: status, notified: notify },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: previous.leadId ?? undefined,
  });

  // Notify client by email (skip ARCHIVED + DRAFT — they're internal states)
  const clientFacingStatuses: ProjectStatus[] = [
    ProjectStatus.QUOTED,
    ProjectStatus.SIGNED,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.IN_REVIEW,
    ProjectStatus.SHIPPED,
  ];
  if (notify && previous.lead?.email && clientFacingStatuses.includes(status)) {
    await sendProjectStatusUpdate({
      to: previous.lead.email,
      name: previous.lead.name,
      projectId,
      projectName: previous.name,
      newStatus: status,
    }).catch(() => {
      // non-fatal
    });
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

export async function addProjectNote(formData: FormData) {
  const { user } = await requireMutator();
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: { select: { email: true, name: true } } },
  });

  await logActivity({
    kind: ActivityKind.PROJECT_NOTE_ADDED,
    summary: body.slice(0, 80) + (body.length > 80 ? "…" : ""),
    metadata: { noteId: note.id, visibleToClient },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: project?.leadId ?? undefined,
  });

  // Notify client only when note is marked visible.
  if (visibleToClient && project?.lead?.email) {
    await sendClientNote({
      to: project.lead.email,
      name: project.lead.name,
      projectId,
      projectName: project.name,
      body,
    }).catch(() => {});
  }

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addDeliverable(formData: FormData) {
  const { user } = await requireMutator();
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: { select: { email: true, name: true } } },
  });

  await logActivity({
    kind: ActivityKind.DELIVERABLE_ADDED,
    summary: `Livrable ajouté: ${title}`,
    metadata: { deliverableId: deliverable.id },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId,
    leadId: project?.leadId ?? undefined,
  });

  if (project?.lead?.email) {
    await sendDeliverableAdded({
      to: project.lead.email,
      name: project.lead.name,
      projectId,
      projectName: project.name,
      deliverableTitle: title,
      deliverableUrl: url,
    }).catch(() => {});
  }

  revalidatePath(`/admin/projects/${projectId}`);
}

/* ------------------------- Support reply (admin) ----------------------- */

export async function replyToSupportRequest(formData: FormData) {
  const { user } = await requireMutator();
  const requestId = formData.get("requestId") as string;
  const reply = (formData.get("reply") as string)?.trim();
  const nextStatus = (formData.get("status") as
    | "OPEN"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED"
    | null) ?? null;
  if (!requestId || !reply) return;

  const request = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    include: {
      project: {
        include: { lead: { select: { email: true, name: true } } },
      },
    },
  });
  if (!request) return;

  // Append the reply as a client-visible note on the project
  await prisma.note.create({
    data: {
      projectId: request.projectId,
      body: `**Réponse au ticket :**\n\n${reply}`,
      visibleToClient: true,
      authorId: user.id,
      authorEmail: user.email ?? "",
    },
  });

  // Update ticket status
  const statusToSet = nextStatus ?? "IN_PROGRESS";
  await prisma.supportRequest.update({
    where: { id: requestId },
    data: {
      status: statusToSet,
      resolvedAt:
        statusToSet === "RESOLVED" || statusToSet === "CLOSED" ? new Date() : null,
    },
  });

  await logActivity({
    kind:
      statusToSet === "RESOLVED" || statusToSet === "CLOSED"
        ? ActivityKind.SUPPORT_REQUEST_RESOLVED
        : ActivityKind.PROJECT_NOTE_ADDED,
    summary: `Réponse support (→ ${statusToSet})`,
    metadata: { requestId, status: statusToSet },
    authorId: user.id,
    authorEmail: user.email ?? "",
    projectId: request.projectId,
    leadId: request.project.leadId ?? undefined,
  });

  if (request.project.lead?.email) {
    await sendSupportReplyToClient({
      to: request.project.lead.email,
      name: request.project.lead.name,
      projectId: request.projectId,
      projectName: request.project.name,
      reply,
      status: statusToSet,
    }).catch(() => {});
  }

  revalidatePath(`/admin/projects/${request.projectId}`);
  revalidatePath(`/admin/support`);
  revalidatePath(`/client/projects/${request.projectId}`);
}

/* ------------------------- Client portal invitation -------------------- */

export type InviteResult =
  | { ok: true; sentTo: string }
  | { ok: false; error: string };

export async function inviteClientToPortal(formData: FormData): Promise<InviteResult> {
  const { user } = await requireMutator();
  const projectId = formData.get("projectId") as string;
  if (!projectId) return { ok: false, error: "Missing project id" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: { select: { id: true, email: true, name: true } } },
  });
  if (!project) return { ok: false, error: "Projet introuvable" };
  if (!project.lead?.email) {
    return { ok: false, error: "Ce projet n'a pas de lead associé avec un email" };
  }

  // The site origin (parent app) is where /auth/callback lives — link must hit
  // the parent origin's callback to set Supabase cookies for both
  // hulabe.com and client.hulabe.com (cross-subdomain).
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";
  // After password set, we land them on the setup-password page; once they've
  // set a password they can navigate to their project from /client.
  const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent("/client/setup-password")}`;

  let magicLink: string;
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // Try invite first (creates the auth user if not exists).
    const inv = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: project.lead.email,
      options: { redirectTo },
    });
    if (!inv.error && inv.data?.properties?.action_link) {
      magicLink = inv.data.properties.action_link;
    } else {
      // Fall back to recovery (user already exists).
      const rec = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: project.lead.email,
        options: { redirectTo },
      });
      if (rec.error || !rec.data?.properties?.action_link) {
        return {
          ok: false,
          error:
            rec.error?.message ?? inv.error?.message ?? "Impossible de générer le lien",
        };
      }
      magicLink = rec.data.properties.action_link;
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur Supabase admin",
    };
  }

  try {
    await sendClientPortalInvitation({
      to: project.lead.email,
      name: project.lead.name,
      magicLink,
      projectName: project.name,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        "Magic link généré mais l'envoi email a échoué. Re-tente ou copie le lien manuellement.",
    };
  }

  await prisma.activity.create({
    data: {
      kind: ActivityKind.PROJECT_NOTE_ADDED,
      summary: `Invitation au portail envoyée à ${project.lead.email}`,
      metadata: { invited: true },
      authorId: user.id,
      authorEmail: user.email ?? "",
      projectId,
      leadId: project.leadId ?? undefined,
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true, sentTo: project.lead.email };
}

/* ----------------------------- AI lead scoring ----------------------------- */

export async function rescoreLead(formData: FormData) {
  await requireMutator();
  const leadId = formData.get("leadId") as string;
  if (!leadId) return;
  await scoreAndSaveLead(leadId);
  revalidatePath(`/admin/leads/${leadId}`);
}
