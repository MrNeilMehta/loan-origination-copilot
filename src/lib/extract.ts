import { generateText, parseJsonLoose } from "./llm";
import { ExtractedFieldDraft, FIELD_LABELS, FieldKey } from "./types";

const SYSTEM = `You are an extraction engine for a bank's loan underwriting team.
You read raw text from a small business's bank statement and pull out a fixed set
of financial signals. You never guess: if a value is not clearly supported by the
text, return it with a low confidence and an empty sourceQuote. For every value you
DO return, you must include the exact snippet of source text it came from, so a human
underwriter can verify it. Return only numbers (no currency symbols or commas) in value.`;

const FIELDS_SPEC = (Object.keys(FIELD_LABELS) as FieldKey[])
  .map((k) => `- ${k} (${FIELD_LABELS[k].unit}): ${FIELD_LABELS[k].label}`)
  .join("\n");

function buildPrompt(rawText: string): string {
  return `Extract these fields from the bank statement text below.

Fields to extract:
${FIELDS_SPEC}

For monthlyRevenueAvg, use total deposits/credits for the period as a proxy for revenue
unless a clearer revenue figure is present.

Return ONLY a JSON array, no prose, where each item is:
{ "key": <one of the keys above>,
  "value": <number as a string, no symbols>,
  "confidence": <number 0..1>,
  "sourceQuote": <verbatim snippet from the statement, or "" if not found> }

Bank statement text:
"""
${rawText}
"""`;
}

interface RawDraft {
  key: FieldKey;
  value: string;
  confidence: number;
  sourceQuote: string;
}

export async function extractFields(rawText: string): Promise<ExtractedFieldDraft[]> {
  const text = await generateText({
    system: SYSTEM,
    prompt: buildPrompt(rawText),
    maxTokens: 1500,
    json: true,
  });

  const drafts = parseJsonLoose<RawDraft[]>(text);

  // Normalize against our known field set; ignore anything the model invented.
  return drafts
    .filter((d) => d.key in FIELD_LABELS)
    .map((d) => ({
      key: d.key,
      label: FIELD_LABELS[d.key].label,
      unit: FIELD_LABELS[d.key].unit,
      value: String(d.value ?? "").trim(),
      confidence: Math.max(0, Math.min(1, Number(d.confidence) || 0)),
      sourceQuote: (d.sourceQuote ?? "").trim(),
    }));
}
