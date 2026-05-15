"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/client/auth";
import { sendSupportNotificationToAdmin } from "@/lib/resend";

export async function openSupportRequest(formData: FormData) {
  const user = await requireClient();
  const projectId = formData.get("projectId") as string;
  const body = (formData.get("body") as string)?.trim();
  if (!projectId || !body) return;

  // Verify project belongs to client
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      lead: { email: user.email!.toLowerCase() },
    },
    include: { lead: { select: { name: true } } },
  });
  if (!project) return;

  // Block if support window has expired AND no active maintenance contract
  // (we don't have maintenance contracts yet — TBD)
  // Allow always for now: admin can decide what to charge.

  const request = await prisma.supportRequest.create({
    data: {
      projectId,
      body,
      createdById: user.id,
      createdByEmail: user.email!,
    },
  });

  await prisma.activity.create({
    data: {
      kind: "SUPPORT_REQUEST_OPENED",
      summary: body.slice(0, 80) + (body.length > 80 ? "…" : ""),
      metadata: { supportRequestId: request.id },
      authorId: user.id,
      authorEmail: user.email!,
      projectId,
      leadId: project.leadId ?? undefined,
    },
  });

  // Notify admin
  await sendSupportNotificationToAdmin({
    projectName: project.name,
    clientName: project.lead?.name ?? user.email!,
    clientEmail: user.email!,
    body,
    projectId,
  }).catch(() => {
    /* non-fatal */
  });

  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath("/client/support");
}
