import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const apps = await prisma.application.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { documents: true, fields: true } }, memo: true },
  });
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessName, applicantName, loanAmount } = body ?? {};

  if (!businessName || !applicantName) {
    return NextResponse.json(
      { error: "businessName and applicantName are required." },
      { status: 400 }
    );
  }

  const app = await prisma.application.create({
    data: {
      businessName,
      applicantName,
      loanAmount: loanAmount ? Number(loanAmount) : null,
      auditLogs: { create: { actor: "system", action: "CREATED" } },
    },
  });

  return NextResponse.json(app, { status: 201 });
}
