"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/auth/site-origin";
import {
  sendAdminPasswordEmail,
  sendClientPasswordEmail,
} from "@/lib/resend";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function normalize(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Generate a Supabase link for the given email. Tries recovery first
 * (works if user already exists in auth.users), falls back to invite (creates user).
 * Returns the action URL.
 */
async function generateSetupLink(
  email: string,
  redirectTo: string,
): Promise<
  | { ok: true; link: string; mode: "recovery" | "invite" }
  | { ok: false; error: string }
> {
  const supabaseAdmin = createSupabaseAdminClient();

  // Try recovery first
  const rec = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  if (!rec.error && rec.data?.properties?.action_link) {
    return { ok: true, link: rec.data.properties.action_link, mode: "recovery" };
  }

  // Fall back to invite — creates the auth.users row
  const inv = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (inv.error || !inv.data?.properties?.action_link) {
    return {
      ok: false,
      error: inv.error?.message ?? "Impossible de générer le lien",
    };
  }
  return { ok: true, link: inv.data.properties.action_link, mode: "invite" };
}

/* ---------------------------- Admin recovery/setup --------------------- */

/**
 * Sends a "set password" or "reset password" email to an admin.
 * Used for the seeded first OWNER and any subsequent forgot-password flow.
 */
export async function sendAdminSetupLink(formData: FormData): Promise<ActionResult> {
  const emailRaw = formData.get("email") as string | null;
  if (!emailRaw) return { ok: false, error: "Email requis" };
  const email = normalize(emailRaw);

  // Check admin exists & is active
  const admin = await prisma.adminUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!admin || !admin.isActive) {
    // Don't leak which emails are admins
    return {
      ok: true,
      message:
        "Si cet email est associé à un admin actif, tu vas recevoir un lien dans quelques secondes.",
    };
  }

  const origin = await getSiteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/admin/setup-password")}`;
  const linkRes = await generateSetupLink(email, redirectTo);
  if (!linkRes.ok) return { ok: false, error: linkRes.error };

  try {
    await sendAdminPasswordEmail({
      to: email,
      name: admin.name,
      link: linkRes.link,
      mode: linkRes.mode,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Le lien est généré mais l'envoi email a échoué.",
    };
  }

  return {
    ok: true,
    message: `Lien envoyé à ${email}. Vérifie ta boîte mail (et les spams).`,
  };
}

/* ---------------------------- Client recovery/setup --------------------- */

export async function sendClientSetupLink(formData: FormData): Promise<ActionResult> {
  const emailRaw = formData.get("email") as string | null;
  if (!emailRaw) return { ok: false, error: "Email requis" };
  const email = normalize(emailRaw);

  // Check client has at least one project
  const hasProject = await prisma.lead.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      projects: { some: {} },
    },
    select: { id: true, name: true },
  });
  if (!hasProject) {
    return {
      ok: true,
      message:
        "Si cet email est associé à un projet, tu vas recevoir un lien dans quelques secondes.",
    };
  }

  const origin = await getSiteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/client/setup-password")}`;
  const linkRes = await generateSetupLink(email, redirectTo);
  if (!linkRes.ok) return { ok: false, error: linkRes.error };

  try {
    await sendClientPasswordEmail({
      to: email,
      name: hasProject.name,
      link: linkRes.link,
      mode: linkRes.mode,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Le lien est généré mais l'envoi email a échoué.",
    };
  }

  return {
    ok: true,
    message: `Lien envoyé à ${email}. Vérifie ta boîte mail.`,
  };
}

/* ---------------------- Set password (signed-in user) ------------------- */

/**
 * Called after a user lands on /admin/setup-password or /client/setup-password
 * with a valid session (from invite or recovery link).
 * Marks the AdminUser.passwordSetAt if applicable.
 */
export async function markPasswordSet(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Pas connecté" };

  // Persist on AdminUser (for admins) — best effort
  await prisma.adminUser
    .updateMany({
      where: { email: { equals: user.email, mode: "insensitive" } },
      data: { passwordSetAt: new Date() },
    })
    .catch(() => {});

  // Persist on Supabase user metadata so the gate works for non-admin users
  // (clients, etc.) too. Read by requireClient() and elsewhere.
  await supabase.auth
    .updateUser({
      data: { passwordSetAt: new Date().toISOString() },
    })
    .catch(() => {});

  revalidatePath("/admin");
  revalidatePath("/admin/team");
  revalidatePath("/client");
  return { ok: true };
}

