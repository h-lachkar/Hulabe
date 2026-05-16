import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/client/auth";
import { getDeliverableSignedUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Client portal version: verifies the deliverable belongs to a project owned
 * by the current client's email AND is marked visibleToClient before serving.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireClient();
  const { id } = await params;
  const lower = user.email!.toLowerCase();
  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: lower, mode: "insensitive" }, role: "CLIENT" },
    select: { id: true },
  });
  const d = await prisma.deliverable.findFirst({
    where: {
      id,
      visibleToClient: true,
      project: {
        OR: [
          ...(dbUser ? [{ members: { some: { userId: dbUser.id } } }] : []),
          { lead: { email: lower } },
        ],
      },
    },
  });
  if (!d || !d.fileKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = await getDeliverableSignedUrl(d.fileKey, 60 * 60);
  if (!url) {
    return NextResponse.json({ error: "Storage error" }, { status: 502 });
  }
  return NextResponse.redirect(url);
}
