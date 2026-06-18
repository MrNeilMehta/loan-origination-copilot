import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeRatios } from "@/lib/ratios";
import { generateMemo } from "@/lib/memo";

function num(value: string | undefined): number {
  return Number((value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: { fields: true },
  });
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const byKey = Object.fromEntries(app.fields.map((f) => [f.key, f.value]));
  const ratios = computeRatios({
    monthlyRevenueAvg: num(byKey["monthlyRevenueAvg"]),
    existingDebtMonthly: num(byKey["existingDebtMonthly"]),
    requestedLoanAmount: app.loanAmount ?? 0,
  });

  let content: string;
  try {
    content = await generateMemo({
      businessName: app.businessName,
      applicantName: app.applicantName,
      requestedLoanAmount: app.loanAmount ?? 0,
      verifiedFields: app.fields.map((f) => ({
        label: f.label,
        value: f.value,
        unit: f.unit ?? "",
        verified: f.verified,
      })),
      ratios,
    });
  } catch (err) {
    console.error("[memo] failed:", err);
    return NextResponse.json(
      { error: "Memo generation failed. Check ANTHROPIC_API_KEY." },
      { status: 502 }
    );
  }

  // Round-trip to a plain JSON value so it satisfies Prisma's Json input type.
  const ratiosJson = JSON.parse(JSON.stringify(ratios));

  const memo = await prisma.creditMemo.upsert({
    where: { applicationId: id },
    create: { applicationId: id, content, ratios: ratiosJson },
    update: { content, ratios: ratiosJson, generatedAt: new Date() },
  });

  await prisma.application.update({
    where: { id },
    data: {
      status: "REVIEWED",
      auditLogs: { create: { actor: "reviewer", action: "GENERATED_MEMO" } },
    },
  });

  return NextResponse.json(memo);
}
