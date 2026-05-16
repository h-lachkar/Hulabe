"use server";

import { revalidatePath } from "next/cache";
import { ActivityKind, DeliverableKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMutator, requireOwner } from "@/lib/admin/auth";
import {
  uploadDeliverableFile,
  deleteDeliverableFile,
} from "@/lib/supabase/storage";
import { sendDeliverableAdded } from "@/lib/resend";

const ALLOWED_KINDS = new Set<DeliverableKind>([
  "TEXT",
  "LINK",
  "REPO",
  "DEPLOYMENT",
  "DESIGN",
  "DOC",
  "FILE",
]);

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Create a deliverable. Supports:
 *   - kind=TEXT  → title + description (no URL, no file)
 *   - kind=LINK/REPO/DEPLOYMENT/DESIGN/DOC → title + url + optional description
 *   - kind=FILE  → title + uploaded file (Supabase Storage)
 */
export async function createDeliverable(formData: FormData): Promise<void> {
  const { user } = await requireMutator();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "LINK") as DeliverableKind;
  const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "LINK";
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const visibleToClient = formData.get("visibleToClient") === "on";

  if (!projectId || !title) {
    throw new Error("projectId and title are required");
  }

  let fileKey: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileContentType: string | null = null;

  if (kind === "FILE") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("File is required for kind=FILE.");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`);
    }
    const uploaded = await uploadDeliverableFile(projectId, file);
    fileKey = uploaded.key;
    fileName = file.name;
    fileSize = uploaded.size;
    fileContentType = uploaded.contentType;
  }

  // Validation: LINK/REPO/etc need a URL, TEXT needs a description
  if (kind === "TEXT" && !description) {
    throw new Error("Description is required for text deliverables.");
  }
  if (kind !== "TEXT" && kind !== "FILE" && !url) {
    throw new Error("URL is required for link deliverables.");
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      projectId,
      kind,
      title,
      description,
      url,
      fileKey,
      fileName,
      fileSize,
      fileContentType,
      visibleToClient,
      deliveredAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      kind: ActivityKind.DELIVERABLE_ADDED,
      summary: `Added deliverable: ${title}`,
      metadata: { deliverableId: deliverable.id, kind },
      projectId,
      authorId: user.id,
      authorEmail: user.email,
    },
  });

  // Best-effort client email (only if visible and project has a lead)
  if (visibleToClient) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { lead: true },
      });
      if (project?.lead?.email) {
        await sendDeliverableAdded({
          to: project.lead.email,
          name: project.lead.name ?? undefined,
          projectId: project.id,
          projectName: project.name,
          deliverableTitle: title,
          deliverableUrl: url ?? undefined,
        });
      }
    } catch {
      /* non-fatal */
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/client/projects/${projectId}`);
}

export async function deleteDeliverable(formData: FormData): Promise<void> {
  await requireMutator();
  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  if (!deliverableId) return;
  const d = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  if (!d) return;
  await prisma.deliverable.delete({ where: { id: deliverableId } });
  // Best-effort cleanup of the underlying file
  if (d.fileKey) {
    await deleteDeliverableFile(d.fileKey).catch(() => {});
  }
  revalidatePath(`/admin/projects/${d.projectId}`);
  revalidatePath(`/client/projects/${d.projectId}`);
}

export async function toggleDeliverableVisibility(formData: FormData): Promise<void> {
  await requireMutator();
  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  if (!deliverableId) return;
  const d = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  if (!d) return;
  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { visibleToClient: !d.visibleToClient },
  });
  revalidatePath(`/admin/projects/${d.projectId}`);
  revalidatePath(`/client/projects/${d.projectId}`);
}
