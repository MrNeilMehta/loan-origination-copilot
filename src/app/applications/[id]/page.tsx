import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeRatios } from "@/lib/ratios";
import ReviewClient from "./review-client";

export const dynamic = "force-dynamic";

function num(v: string | undefined): number {
  return Number((v ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

export default async function ApplicationPage({ params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      fields: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { uploadedAt: "asc" } },
      memo: true,
      auditLogs: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!app) notFound();

  const byKey = Object.fromEntries(app.fields.map((f) => [f.key, f.value]));
  const ratios = computeRatios({
    monthlyRevenueAvg: num(byKey["monthlyRevenueAvg"]),
    existingDebtMonthly: num(byKey["existingDebtMonthly"]),
    requestedLoanAmount: app.loanAmount ?? 0,
  });

  return (
    <ReviewClient
      app={{
        id: app.id,
        businessName: app.businessName,
        applicantName: app.applicantName,
        loanAmount: app.loanAmount,
        status: app.status,
        documents: app.documents.map((d) => ({ id: d.id, fileName: d.fileName })),
        fields: app.fields.map((f) => ({
          id: f.id,
          key: f.key,
          label: f.label,
          value: f.value,
          unit: f.unit,
          confidence: f.confidence,
          sourceQuote: f.sourceQuote,
          verified: f.verified,
        })),
        memo: app.memo ? { content: app.memo.content } : null,
        auditLogs: app.auditLogs.map((l) => ({
          id: l.id,
          actor: l.actor,
          action: l.action,
          detail: l.detail,
          createdAt: l.createdAt.toISOString(),
        })),
      }}
      ratios={ratios}
    />
  );
}
