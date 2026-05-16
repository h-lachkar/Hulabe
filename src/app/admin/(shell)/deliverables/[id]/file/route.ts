import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { getDeliverableSignedUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Redirects to a short-lived Supabase Storage signed URL for the deliverable's
 * file. Allows the admin (or — via /client redirect equivalent — the client)
 * to download the file without exposing the underlying storage key.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const d = await prisma.deliverable.findUnique({ where: { id } });
  if (!d || !d.fileKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = await getDeliverableSignedUrl(d.fileKey, 60 * 60); // 1h
  if (!url) {
    return NextResponse.json({ error: "Storage error" }, { status: 502 });
  }
  return NextResponse.redirect(url);
}
