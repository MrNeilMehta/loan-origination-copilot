import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  // Not throwing at import time so the app still boots without a key;
  // the API routes return a friendly error instead.
  console.warn("[anthropic] ANTHROPIC_API_KEY is not set. Extraction/memo will fail until you add it to .env");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export const MODEL = "claude-sonnet-4-6";

// Pull the first text block out of a Messages API response.
export function firstText(msg: Anthropic.Message): string {
  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

// Models sometimes wrap JSON in ```json fences. Strip them before parsing.
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}
