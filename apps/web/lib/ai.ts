import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  });

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

export const MODEL = "claude-sonnet-4-20250514" as const;
export const MAX_TOKENS = 4096;

export async function callAgent<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<T> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: options?.maxTokens || MAX_TOKENS,
        temperature: options?.temperature ?? 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const content = response.content[0];
      if (content.type !== "text") throw new Error("Unexpected response type");

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
}
