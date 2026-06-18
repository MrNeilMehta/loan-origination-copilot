import { generateText } from "./llm";
import { RatioResult } from "./ratios";

interface MemoInput {
  businessName: string;
  applicantName: string;
  requestedLoanAmount: number;
  verifiedFields: { label: string; value: string; unit: string; verified: boolean }[];
  ratios: RatioResult;
}

const SYSTEM = `You are an analyst drafting an internal credit memo for a small business loan.
Write for a human underwriter who will review and edit. Be concise, factual, and neutral.
Only state what the provided data supports. Flag risks and any unverified inputs explicitly.
Never state a final approve/decline decision — recommend next steps instead. Output markdown.`;

export async function generateMemo(input: MemoInput): Promise<string> {
  const fieldLines = input.verifiedFields
    .map((f) => `- ${f.label}: ${f.value} ${f.unit}${f.verified ? "" : " (UNVERIFIED)"}`)
    .join("\n");

  const dscrText = input.ratios.dscr === null ? "n/a" : input.ratios.dscr.toFixed(2);

  const prompt = `Draft a credit memo with these sections: Summary, Cash Flow, Risk Flags, Recommended Next Steps.

Applicant: ${input.applicantName}
Business: ${input.businessName}
Requested amount: $${input.requestedLoanAmount.toLocaleString()}

Extracted financials:
${fieldLines}

Computed metrics (illustrative assumptions: ${input.ratios.assumptions.cashFlowMargin * 100}% cash-flow margin, ${input.ratios.assumptions.aprPct}% APR, ${input.ratios.assumptions.termMonths}-month term):
- Estimated annual revenue: $${Math.round(input.ratios.estAnnualRevenue).toLocaleString()}
- Estimated annual cash flow available for debt: $${Math.round(input.ratios.estAnnualCashFlow).toLocaleString()}
- Total annual debt service (existing + proposed): $${Math.round(input.ratios.totalAnnualDebt).toLocaleString()}
- DSCR: ${dscrText} (a DSCR below 1.25 typically warrants extra scrutiny)

Keep it under 250 words.`;

  return generateText({ system: SYSTEM, prompt, maxTokens: 1200 });
}
