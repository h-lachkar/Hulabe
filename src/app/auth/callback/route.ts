import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findActiveAdminByEmail } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Supabase may bounce auth errors back via query params on the redirect target.
  if (errorParam) {
    console.error("[/auth/callback] supabase error:", errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/admin/login?error=invalid_link`, url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();

  // Path A — PKCE / OAuth: ?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[/auth/callback] exchangeCodeForSession:", error.message);
      return NextResponse.redirect(
        new URL("/admin/login?error=invalid_link", url.origin),
      );
    }
  }
  // Path B — email OTP / recovery / invite / magiclink: ?token_hash=...&type=...
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      console.error("[/auth/callback] verifyOtp:", error.message);
      return NextResponse.redirect(
        new URL("/admin/login?error=invalid_link", url.origin),
      );
    }
  } else {
    // Neither code nor token_hash — bad link
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid_link", url.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid_link", url.origin),
    );
  }

  // Honor explicit next= when provided (invite/recovery links from generateLink).
  if (next) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // No next param — route based on identity.
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
  return NextResponse.redirect(
    new URL("/admin/login?error=not_authorized", url.origin),
  );
}
