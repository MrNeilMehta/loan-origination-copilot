// The fields we try to pull from a small-business bank statement.
// Keep this list short and high-signal — these are the numbers an underwriter
// actually reaches for first when sizing a loan.
export type FieldKey =
  | "monthlyRevenueAvg"
  | "avgDailyBalance"
  | "existingDebtMonthly"
  | "nsfCount"
  | "depositCount";

export interface ExtractedFieldDraft {
  key: FieldKey;
  label: string;
  value: string;
  unit: string;
  confidence: number; // 0..1
  sourceQuote: string; // verbatim snippet from the document
}

export const FIELD_LABELS: Record<FieldKey, { label: string; unit: string }> = {
  monthlyRevenueAvg: { label: "Average monthly revenue", unit: "USD" },
  avgDailyBalance: { label: "Average daily balance", unit: "USD" },
  existingDebtMonthly: { label: "Existing monthly debt service", unit: "USD" },
  nsfCount: { label: "NSF / returned items", unit: "count" },
  depositCount: { label: "Deposit count", unit: "count" },
};
