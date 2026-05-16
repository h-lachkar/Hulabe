"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMutator } from "@/lib/admin/auth";
import { sendAdminEmail, type AdminEmailTemplate } from "@/lib/resend";

export type SendEmailResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const ALLOWED_TEMPLATES = new Set<AdminEmailTemplate>([
  "WELCOME",
  "QUOTE_SENT",
  "PROJECT_UPDATE",
  "FEEDBACK_REQUEST",
  "CUSTOM",
]);

/**
 * Send a predefined-template email to a lead or client from the admin UI.
 * Fields:
 *   - template: WELCOME | QUOTE_SENT | PROJECT_UPDATE | FEEDBACK_REQUEST | CUSTOM
 *   - to: email
 *   - recipientName, projectName, customSubject, customBody, ctaUrl, ctaLabel
 *   - leadId | projectId : optional context for activity log
 */
export async function sendTemplateEmail(formData: FormData): Promise<SendEmailResult> {
  const { user } = await requireMutator();
  const to = String(formData.get("to") ?? "").trim();
  const templateRaw = String(formData.get("template") ?? "") as AdminEmailTemplate;
  if (!to || !ALLOWED_TEMPLATES.has(templateRaw)) {
    return { ok: false, error: "Invalid template or recipient." };
  }

  const recipientName = String(formData.get("recipientName") ?? "").trim() || undefined;
  const projectName = String(formData.get("projectName") ?? "").trim() || undefined;
  const customSubject = String(formData.get("customSubject") ?? "").trim() || undefined;
  const customBody = String(formData.get("customBody") ?? "").trim() || undefined;
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim() || undefined;
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || undefined;
  const leadId = String(formData.get("leadId") ?? "").trim() || undefined;
  const projectId = String(formData.get("projectId") ?? "").trim() || undefined;

  try {
    await sendAdminEmail({
      to,
      template: templateRaw,
      vars: { recipientName, projectName, customSubject, customBody, ctaUrl, ctaLabel },
    });

    // Log activity for audit trail
    if (leadId || projectId) {
      await prisma.activity.create({
        data: {
          kind: leadId ? "LEAD_NOTE_ADDED" : "PROJECT_NOTE_ADDED",
          summary: `Sent ${templateRaw} email to ${to}`,
          metadata: { template: templateRaw, to },
          authorId: user.id,
          authorEmail: user.email,
          leadId: leadId,
          projectId: projectId,
        },
      });
    }

    if (leadId) revalidatePath(`/admin/leads/${leadId}`);
    if (projectId) revalidatePath(`/admin/projects/${projectId}`);
    return { ok: true, message: "Email sent." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}
