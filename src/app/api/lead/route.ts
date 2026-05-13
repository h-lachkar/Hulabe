import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { sendLeadConfirmation, sendLeadNotification } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`lead:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);

  try {
    const lead = await prisma.lead.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        source: "CONTACT_FORM",
        message: data.message,
        locale: data.locale,
        ipHash,
      },
    });

    await prisma.activity.create({
      data: {
        kind: "LEAD_CREATED",
        summary: `Contact form: ${data.email}`,
        leadId: lead.id,
        metadata: { source: "CONTACT_FORM" },
      },
    });

    await Promise.allSettled([
      sendLeadConfirmation({ to: data.email, name: data.name, locale: data.locale }),
      sendLeadNotification({
        source: "CONTACT_FORM",
        email: data.email,
        name: data.name,
        message: data.message,
        locale: data.locale,
        leadId: lead.id,
      }),
    ]);

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    console.error("[/api/lead]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
