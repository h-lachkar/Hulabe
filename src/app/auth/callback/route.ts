import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findActiveAdminByEmail } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_link", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_link", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=invalid_link", url.origin));
  }

  // Admin path: check AdminUser table (case-insensitive)
  const admin = await findActiveAdminByEmail(user.email);
  if (admin) {
    // Update lastLoginAt
    prisma.adminUser
      .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});
    return NextResponse.redirect(new URL(next ?? "/admin", url.origin));
  }

  // Client portal path: must be a lead with at least one project for this email
  const hasProject = await prisma.lead.findFirst({
    where: {
      email: user.email.toLowerCase(),
      projects: { some: {} },
    },
    select: { id: true },
  });

  if (hasProject) {
    return NextResponse.redirect(new URL(next ?? "/client", url.origin));
  }

  // Neither admin nor known client — sign out and reject
  await supabase.auth.signOut();
  // Default rejection target: admin login (more useful since invited admins
  // come from there). Client portal users will get the same message via /client/login.
  const target = next?.startsWith("/client") ? "/client/login" : "/admin/login";
  return NextResponse.redirect(new URL(`${target}?error=not_authorized`, url.origin));
}
