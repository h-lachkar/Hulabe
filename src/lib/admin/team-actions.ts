"use server";

import { revalidatePath } from "next/cache";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAdminInvitation } from "@/lib/resend";

export type TeamActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/* ------------------------------ Helpers --------------------------------- */

async function generateAdminMagicLink(email: string) {
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";
  const redirectTo = `${siteOrigin}/auth/callback?next=${encodeURIComponent("/admin/setup-password")}`;

  const supabaseAdmin = createSupabaseAdminClient();

  // Try invite first (creates user if not exists, sends invitation flow).
  const inv = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (!inv.error && inv.data?.properties?.action_link) {
    return inv.data.properties.action_link as string;
  }

  // Fall back to recovery (e.g. user already exists with confirmed email).
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/* ------------------------------ Invite ---------------------------------- */

export async function inviteAdmin(formData: FormData): Promise<TeamActionResult> {
  const ctx = await requireOwner();
  const emailRaw = formData.get("email") as string | null;
  const name = ((formData.get("name") as string | null) ?? "").trim() || null;
  const roleRaw = formData.get("role") as string | null;

  if (!emailRaw) return { ok: false, error: "Email requis" };
  const email = normalizeEmail(emailRaw);
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "Email invalide" };
  }

  const role: AdminRole = (
    roleRaw === "OWNER" || roleRaw === "ADMIN" || roleRaw === "VIEWER"
      ? roleRaw
      : "ADMIN"
  ) as AdminRole;

  // Check if admin already exists with this email
  const existing = await prisma.adminUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return {
      ok: false,
      error: existing.isActive
        ? "Un admin actif existe déjà avec cet email"
        : "Un admin désactivé existe déjà avec cet email — réactive-le plutôt",
    };
  }

  let magicLink: string;
  try {
    magicLink = await generateAdminMagicLink(email);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur Supabase" };
  }

  await prisma.adminUser.create({
    data: {
      email,
      name,
      role,
      isActive: true,
      invitedById: ctx.admin.id,
      invitedAt: new Date(),
    },
  });

  try {
    await sendAdminInvitation({
      to: email,
      name,
      inviterName: ctx.admin.name,
      inviterEmail: ctx.admin.email,
      magicLink,
      role,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        "Admin créé mais l'envoi email a échoué. Tu peux renvoyer l'invite depuis la liste.",
    };
  }

  revalidatePath("/admin/team");
  return { ok: true, message: `Invitation envoyée à ${email}` };
}

/* --------------------------- Resend invite ------------------------------ */

export async function resendAdminInvite(formData: FormData): Promise<TeamActionResult> {
  const ctx = await requireOwner();
  const id = formData.get("id") as string;
  if (!id) return { ok: false, error: "Missing id" };

  const admin = await prisma.adminUser.findUnique({ where: { id } });
  if (!admin) return { ok: false, error: "Admin introuvable" };
  if (!admin.isActive) return { ok: false, error: "Admin désactivé — réactive-le d'abord" };

  let magicLink: string;
  try {
    magicLink = await generateAdminMagicLink(admin.email);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur Supabase" };
  }

  try {
    await sendAdminInvitation({
      to: admin.email,
      name: admin.name,
      inviterName: ctx.admin.name,
      inviterEmail: ctx.admin.email,
      magicLink,
      role: admin.role,
    });
  } catch (err) {
    return { ok: false, error: "L'envoi email a échoué." };
  }

  await prisma.adminUser.update({
    where: { id },
    data: { invitedAt: new Date() },
  });

  revalidatePath("/admin/team");
  return { ok: true, message: `Nouveau lien envoyé à ${admin.email}` };
}

/* ------------------------------ Deactivate ------------------------------ */

export async function setAdminActive(formData: FormData): Promise<TeamActionResult> {
  const ctx = await requireOwner();
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  if (!id) return { ok: false, error: "Missing id" };

  if (id === ctx.admin.id && !active) {
    return { ok: false, error: "Tu ne peux pas te désactiver toi-même" };
  }

  // Last-owner protection
  if (!active) {
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (target?.role === "OWNER") {
      const otherActiveOwners = await prisma.adminUser.count({
        where: { role: "OWNER", isActive: true, id: { not: id } },
      });
      if (otherActiveOwners === 0) {
        return { ok: false, error: "Impossible : c'est le dernier OWNER actif" };
      }
    }
  }

  await prisma.adminUser.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/team");
  return {
    ok: true,
    message: active ? "Admin réactivé" : "Admin désactivé",
  };
}

/* ------------------------------ Delete ---------------------------------- */

export async function deleteAdmin(formData: FormData): Promise<TeamActionResult> {
  const ctx = await requireOwner();
  const id = formData.get("id") as string;
  if (!id) return { ok: false, error: "Missing id" };

  if (id === ctx.admin.id) {
    return { ok: false, error: "Tu ne peux pas te supprimer toi-même" };
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "Admin introuvable" };

  if (target.role === "OWNER") {
    const otherOwners = await prisma.adminUser.count({
      where: { role: "OWNER", id: { not: id } },
    });
    if (otherOwners === 0) {
      return { ok: false, error: "Impossible : c'est le dernier OWNER" };
    }
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/team");
  return { ok: true, message: `${target.email} supprimé` };
}

/* ------------------------------ Update ---------------------------------- */

export async function updateAdminProfile(
  formData: FormData,
): Promise<TeamActionResult> {
  const ctx = await requireOwner();
  const id = formData.get("id") as string;
  const name = ((formData.get("name") as string | null) ?? "").trim() || null;
  const roleRaw = formData.get("role") as string | null;
  if (!id) return { ok: false, error: "Missing id" };

  const role: AdminRole | undefined =
    roleRaw === "OWNER" || roleRaw === "ADMIN" || roleRaw === "VIEWER"
      ? (roleRaw as AdminRole)
      : undefined;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { ok: false, error: "Admin introuvable" };

  // Last-owner protection on demotion
  if (role && target.role === "OWNER" && role !== "OWNER") {
    const otherOwners = await prisma.adminUser.count({
      where: { role: "OWNER", isActive: true, id: { not: id } },
    });
    if (otherOwners === 0) {
      return { ok: false, error: "Impossible : c'est le dernier OWNER actif" };
    }
  }

  await prisma.adminUser.update({
    where: { id },
    data: {
      name,
      ...(role ? { role } : {}),
    },
  });

  // OWNER can't demote themselves (silently prevented) — handled above for last-OWNER.
  // We allow self-rename freely.
  void ctx; // satisfy linter

  revalidatePath("/admin/team");
  return { ok: true, message: "Mis à jour" };
}
