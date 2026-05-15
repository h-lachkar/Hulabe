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

  // Honor explicit next= param when provided (used by invite/recovery links).
  if (next) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // No next param — figure out where to go based on identity.
  const admin = await findActiveAdminByEmail(user.email);
  if (admin) {
    prisma.adminUser
      .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});
    return NextResponse.redirect(new URL("/admin", url.origin));
  }

  const hasProject = await prisma.lead.findFirst({
    where: {
      email: user.email.toLowerCase(),
      projects: { some: {} },
    },
    select: { id: true },
  });

  if (hasProject) {
    return NextResponse.redirect(new URL("/client", url.origin));
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login?error=not_authorized", url.origin));
}
