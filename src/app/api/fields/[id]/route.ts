import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Human-in-the-loop: an underwriter edits a value and/or marks it verified.
// Every change is written to the audit log.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { value, verified } = (await req.json()) ?? {};

  const field = await prisma.extractedField.findUnique({ where: { id } });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const updated = await prisma.extractedField.update({
    where: { id },
    data: {
      value: value !== undefined ? String(value) : field.value,
      verified: verified !== undefined ? Boolean(verified) : field.verified,
    },
  });

  await prisma.auditLog.create({
    data: {
      applicationId: field.applicationId,
      actor: "reviewer",
      action: verified ? "VERIFIED_FIELD" : "EDITED_FIELD",
      detail: `${field.label}: ${field.value} -> ${updated.value}`,
    },
  });

  return NextResponse.json(updated);
}
