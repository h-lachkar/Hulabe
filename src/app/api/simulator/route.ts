import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulatorSchema } from "@/lib/validations";
import { sendLeadConfirmation, sendLeadNotification } from "@/lib/resend";
import { computeEstimate } from "@/lib/pricing";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { SERVICE_FLOWS, answerLabel, type Locale } from "@/lib/simulator-flow";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`sim:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = simulatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { min, max } = computeEstimate({
    serviceType: data.serviceType,
    answers: data.answers,
    timeline: data.timeline,
  });

  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);

  // Flatten dynamic answers into a Prisma-compatible features[] for storage.
  // Each entry encoded as `stepId:value` so we can reconstruct in admin.
  const flow = SERVICE_FLOWS[data.serviceType];
  const featuresFlat: string[] = [];
  for (const step of flow.steps) {
    const ans = data.answers[step.id];
    if (Array.isArray(ans)) {
      ans.forEach((v) => featuresFlat.push(`${step.id}:${v}`));
    } else if (typeof ans === "string" && ans.length > 0) {
      // Text answers may be long; only include short values in features array.
      if (step.kind !== "text") featuresFlat.push(`${step.id}:${ans}`);
    }
  }

  // Build a human-readable summary for the message column / notification email.
  const summaryLines: string[] = [];
  for (const step of flow.steps) {
    const ans = data.answers[step.id];
    if (ans == null || (Array.isArray(ans) && ans.length === 0)) continue;
    const label = answerLabel(step, ans, data.locale as Locale);
    if (label) summaryLines.push(`${step.id}: ${label}`);
  }
  const messageWithSummary = [
    summaryLines.length > 0 ? `[Brief]\n${summaryLines.join("\n")}` : "",
    data.message ?? "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  try {
    const lead = await prisma.lead.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        phone: data.phone ?? null,
        source: "SIMULATOR",
        serviceType: data.serviceType,
        budget: data.budget,
        timeline: data.timeline,
        message: messageWithSummary || null,
        features: featuresFlat,
        estimatedPriceMin: min,
        estimatedPriceMax: max,
        locale: data.locale,
        ipHash,
      },
    });

    await prisma.activity.create({
      data: {
        kind: "LEAD_CREATED",
        summary: `Simulator: ${data.serviceType} · ${data.timeline} · ${data.budget}`,
        leadId: lead.id,
        metadata: { source: "SIMULATOR", estimateMin: min, estimateMax: max },
      },
    });

    await Promise.allSettled([
      sendLeadConfirmation({ to: data.email, name: data.name, locale: data.locale }),
      sendLeadNotification({
        source: "SIMULATOR",
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        message: messageWithSummary || null,
        serviceType: data.serviceType,
        budget: data.budget,
        timeline: data.timeline,
        features: featuresFlat,
        estimatedPriceMin: min,
        estimatedPriceMax: max,
        locale: data.locale,
        leadId: lead.id,
      }),
    ]);

    return NextResponse.json({
      success: true,
      id: lead.id,
      estimatedPriceMin: min,
      estimatedPriceMax: max,
    });
  } catch (err) {
    console.error("[/api/simulator]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
