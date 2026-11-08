import OpenAI from "openai";
import { z } from "zod";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  facts: z.string().min(1),
  signedDocumentUrl: z.string().url(),
  deadline: z.string().datetime()
});
export type MatterIntake = z.infer<typeof intakeSchema>;

export type Provider = { name: string; client: OpenAI };

export function chooseProvider(providers: Provider[], failed: Set<string>): Provider {
  const available = providers.find((provider) => !failed.has(provider.name));
  if (!available) throw new Error("all model providers were exhausted");
  return available;
}

export async function modelMatter(intake: MatterIntake, providers: Provider[]): Promise<string> {
  const failed = new Set<string>();
  for (;;) {
    const provider = chooseProvider(providers, failed);
    try {
      const response = await provider.client.chat.completions.create({
        model: "auto",
        messages: [{ role: "user", content: `Summarize matter ${intake.matterId} for ${intake.clientName}. Facts: ${intake.facts}` }]
      });
      return response.choices[0]?.message?.content ?? "";
    } catch (error) {
      failed.add(provider.name);
      if (failed.size === providers.length) throw error;
    }
  }
}

export function buildFollowUp(intake: MatterIntake): { matterId: string; deliveryUrl: string; followUpAt: string } {
  const followUpAt = new Date(new Date(intake.deadline).getTime() - 24 * 60 * 60 * 1000).toISOString();
  return { matterId: intake.matterId, deliveryUrl: intake.signedDocumentUrl, followUpAt };
}
