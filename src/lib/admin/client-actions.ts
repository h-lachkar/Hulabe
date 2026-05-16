"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMutator, requireOwner } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/auth/site-origin";
import { sendClientPortalInvitation } from "@/lib/resend";

export type ClientActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/* ----------------------------- Create / Invite ------------------------- */

export async function createClient(formData: FormData): Promise<ClientActionResult> {
  const ctx = await requireMutator();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sendInvite = formData.get("sendInvite") === "on";

  if (!emailRaw) return { ok: false, error: "Email required" };
  const email = normalizeEmail(emailRaw);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error:
        existing.role === "CLIENT"
          ? "Client with this email already exists."
          : "A user with this email already exists (different role).",
    };
  }

  const client = await prisma.user.create({
    data: {
      email,
      name,
      role: "CLIENT",
      company,
      phone,
      notes,
      invitedById: ctx.admin.id,
      invitedAt: sendInvite ? new Date() : null,
    },
  });

  if (sendInvite) {
    try {
      const siteOrigin = await getSiteOrigin();
      const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent("/client/setup-password")}`;
      const supabaseAdmin = createSupabaseAdminClient();
      const inv = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo },
      });
      if (!inv.error && inv.data?.properties?.action_link) {
        await sendClientPortalInvitation({
          to: email,
          name: name ?? undefined,
          projectName: company ?? "your project",
          magicLink: inv.data.properties.action_link,
        });
      }
    } catch {
      /* non-fatal; admin can resend later */
    }
  }

  revalidatePath("/admin/clients");
  return { ok: true, message: client.id };
}

/* ------------------------------ Update --------------------------------- */

export async function updateClient(formData: FormData): Promise<ClientActionResult> {
  await requireMutator();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) return { ok: false, error: "clientId required" };

  const data: {
    name?: string | null;
    company?: string | null;
    phone?: string | null;
    notes?: string | null;
  } = {};

  // Only include fields actually submitted (allows partial edits)
  if (formData.has("name"))
    data.name = String(formData.get("name") ?? "").trim() || null;
  if (formData.has("company"))
    data.company = String(formData.get("company") ?? "").trim() || null;
  if (formData.has("phone"))
    data.phone = String(formData.get("phone") ?? "").trim() || null;
  if (formData.has("notes"))
    data.notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.user.update({
    where: { id: clientId },
    data,
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

/* ------------------------------ Toggle active -------------------------- */

export async function toggleClientActive(formData: FormData): Promise<void> {
  await requireMutator();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) return;
  const c = await prisma.user.findUnique({ where: { id: clientId } });
  if (!c) return;
  await prisma.user.update({
    where: { id: clientId },
    data: { isActive: !c.isActive },
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
}

/* ------------------------------ Resend invite -------------------------- */

export async function resendClientInvite(formData: FormData): Promise<ClientActionResult> {
  await requireMutator();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) return { ok: false, error: "clientId required" };
  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) return { ok: false, error: "Client not found" };

  try {
    const siteOrigin = await getSiteOrigin();
    const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent("/client/setup-password")}`;
    const supabaseAdmin = createSupabaseAdminClient();
    const link = await supabaseAdmin.auth.admin.generateLink({
      type: client.passwordSetAt ? "recovery" : "invite",
      email: client.email,
      options: { redirectTo },
    });
    if (link.error || !link.data?.properties?.action_link) {
      return { ok: false, error: link.error?.message ?? "Failed to generate link" };
    }
    await sendClientPortalInvitation({
      to: client.email,
      name: client.name ?? undefined,
      projectName: client.company ?? "your project",
      magicLink: link.data.properties.action_link,
    });
    await prisma.user.update({
      where: { id: clientId },
      data: { invitedAt: new Date() },
    });
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: true, message: "Invite sent" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/* ------------------------------ Delete --------------------------------- */

export async function deleteClient(formData: FormData): Promise<void> {
  await requireOwner();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "");
  if (!clientId || confirm !== "DELETE") {
    throw new Error("Type DELETE to confirm.");
  }
  await prisma.user.delete({ where: { id: clientId } });
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}
