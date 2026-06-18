// Illustrative underwriting math. The assumptions are deliberately explicit and
// conservative — in a real deployment an underwriter would tune these per product.
// The point is to show the AI's extracted numbers flowing into a real decision metric.

export interface RatioInputs {
  monthlyRevenueAvg: number;
  existingDebtMonthly: number;
  requestedLoanAmount: number;
}

export interface RatioResult {
  estAnnualRevenue: number;
  estAnnualCashFlow: number; // revenue * assumed margin
  existingAnnualDebt: number;
  proposedAnnualDebt: number;
  totalAnnualDebt: number;
  dscr: number | null; // debt service coverage ratio
  assumptions: { cashFlowMargin: number; aprPct: number; termMonths: number };
}

const CASH_FLOW_MARGIN = 0.15; // assume 15% of revenue is available for debt service
const APR = 0.105; // 10.5% assumed annual rate
const TERM_MONTHS = 60;

export function computeRatios(i: RatioInputs): RatioResult {
  const estAnnualRevenue = i.monthlyRevenueAvg * 12;
  const estAnnualCashFlow = estAnnualRevenue * CASH_FLOW_MARGIN;
  const existingAnnualDebt = i.existingDebtMonthly * 12;

  // Standard amortized monthly payment on the requested loan.
  const r = APR / 12;
  const monthlyPayment =
    i.requestedLoanAmount > 0 && r > 0
      ? (i.requestedLoanAmount * r) / (1 - Math.pow(1 + r, -TERM_MONTHS))
      : 0;
  const proposedAnnualDebt = monthlyPayment * 12;

  const totalAnnualDebt = existingAnnualDebt + proposedAnnualDebt;
  const dscr = totalAnnualDebt > 0 ? estAnnualCashFlow / totalAnnualDebt : null;

  return {
    estAnnualRevenue,
    estAnnualCashFlow,
    existingAnnualDebt,
    proposedAnnualDebt,
    totalAnnualDebt,
    dscr,
    assumptions: { cashFlowMargin: CASH_FLOW_MARGIN, aprPct: APR * 100, termMonths: TERM_MONTHS },
  };
}
