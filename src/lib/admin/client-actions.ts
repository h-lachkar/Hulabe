"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMutator, requireOwner } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientPortalOrigin } from "@/lib/auth/site-origin";
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
      const magicLink = await generateClientMagicLink(email);
      await sendClientPortalInvitation({
        to: email,
        name: name ?? undefined,
        projectName: company ?? "your project",
        magicLink,
      });
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

/**
 * Generate a Supabase magic-link for a client portal user. Tries `invite`
 * first (creates the auth user if missing), falls back to `recovery` if the
 * user already exists in Supabase Auth — which is the common case on resend.
 */
async function generateClientMagicLink(email: string): Promise<string> {
  // Always target the client subdomain — otherwise an admin generating the
  // link from admin.hulabe.com would send the user to admin.hulabe.com/auth/...
  // and end up on admin.hulabe.com/client/setup-password (404).
  const clientOrigin = getClientPortalOrigin();
  const redirectTo = `${clientOrigin}/auth/callback?next=${encodeURIComponent("/client/setup-password")}`;
  const supabaseAdmin = createSupabaseAdminClient();

  const inv = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (!inv.error && inv.data?.properties?.action_link) {
    return inv.data.properties.action_link as string;
  }

  const rec = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  if (rec.error || !rec.data?.properties?.action_link) {
    throw new Error(
      rec.error?.message ?? inv.error?.message ?? "Impossible de générer le lien",
    );
  }
  return rec.data.properties.action_link as string;
}

export async function resendClientInvite(formData: FormData): Promise<ClientActionResult> {
  await requireMutator();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) return { ok: false, error: "clientId required" };
  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) return { ok: false, error: "Client not found" };

  let magicLink: string;
  try {
    magicLink = await generateClientMagicLink(client.email);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }

  try {
    await sendClientPortalInvitation({
      to: client.email,
      name: client.name ?? undefined,
      projectName: client.company ?? "your project",
      magicLink,
    });
  } catch (e) {
    return {
      ok: false,
      error: "Link generated but email failed to send. Try again or check Resend.",
    };
  }

  await prisma.user.update({
    where: { id: clientId },
    data: { invitedAt: new Date() },
  });
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, message: "Invite sent" };
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
