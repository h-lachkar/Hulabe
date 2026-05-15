import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/ai/score-lead";

/**
 * Score a lead by id and persist the result. Safe to call in the background.
 * Never throws — logs errors instead.
 */
export async function scoreAndSaveLead(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return;

    const result = await scoreLead(lead);
    if (!result) return; // No API key

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiScore: result.score,
        aiReasoning: result.reasoning,
        aiSuggestedReply: result.suggestedReply,
        aiNextAction: result.nextAction,
        aiFlags: result.flags,
        aiModel: result.model,
        aiScoredAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        kind: "LEAD_NOTE_ADDED",
        summary: `AI score: ${result.score}/10 · ${result.nextAction.toLowerCase().replace(/_/g, " ")}`,
        metadata: {
          score: result.score,
          flags: result.flags,
          nextAction: result.nextAction,
          model: result.model,
        },
        leadId,
        authorEmail: "ai@hulabe.com",
      },
    });
  } catch (err) {
    console.error("[scoreAndSaveLead]", err);
  }
}
