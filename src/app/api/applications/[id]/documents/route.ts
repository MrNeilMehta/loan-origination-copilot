import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractFields } from "@/lib/extract";

// Accepts pasted statement text, stores it as a Document, runs AI extraction,
// and upserts the extracted fields. PDF upload is the obvious next step (see README).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { fileName, rawText, type } = (await req.json()) ?? {};

  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "rawText is required." }, { status: 400 });
  }

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  await prisma.document.create({
    data: { applicationId: id, fileName: fileName || "pasted-statement.txt", rawText, type: type || "BANK_STATEMENT" },
  });

  let drafts;
  try {
    drafts = await extractFields(rawText);
  } catch (err) {
    console.error("[extract] failed:", err);
    return NextResponse.json(
      { error: "Extraction failed. Check that ANTHROPIC_API_KEY is set in .env." },
      { status: 502 }
    );
  }

  // Upsert so re-running extraction updates existing fields rather than duplicating.
  for (const d of drafts) {
    await prisma.extractedField.upsert({
      where: { applicationId_key: { applicationId: id, key: d.key } },
      create: {
        applicationId: id,
        key: d.key,
        label: d.label,
        value: d.value,
        unit: d.unit,
        confidence: d.confidence,
        sourceQuote: d.sourceQuote,
      },
      update: {
        value: d.value,
        confidence: d.confidence,
        sourceQuote: d.sourceQuote,
        verified: false,
      },
    });
  }

  await prisma.application.update({
    where: { id },
    data: {
      status: "NEEDS_REVIEW",
      auditLogs: { create: { actor: "system", action: "EXTRACTED", detail: `${drafts.length} fields from ${fileName || "pasted text"}` } },
    },
  });

  return NextResponse.json({ extracted: drafts.length });
}
