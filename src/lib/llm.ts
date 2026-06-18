// LLM wrapper backed by Groq's free, OpenAI-compatible API.
// Get a free key (no credit card) at https://console.groq.com/keys — keys start with "gsk_".

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

if (!GROQ_API_KEY) {
  console.warn("[llm] GROQ_API_KEY is not set. Extraction/memo will fail until you add it to .env");
}

interface GenerateArgs {
  system: string;
  prompt: string;
  maxTokens?: number;
  json?: boolean; // kept for compatibility; JSON is handled by parseJsonLoose
}

export async function generateText({ system, prompt, maxTokens = 1200 }: GenerateArgs): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

// Tolerant JSON parse: handles ```json fences and any stray text around the JSON.
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Could not parse JSON from model output: ${cleaned.slice(0, 200)}`);
  }
}
