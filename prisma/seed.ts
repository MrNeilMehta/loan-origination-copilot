import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A realistic-ish bank statement summary you can paste/extract against without
// needing a real PDF. Lets you demo the whole pipeline in 30 seconds.
export const SAMPLE_STATEMENT = `RIVERSIDE COMMUNITY BANK
Business Checking Statement
Account: Maple & Co. Bakery LLC  |  Acct ****4471
Statement period: 03/01/2026 - 03/31/2026

Beginning balance: $18,240.55
Total deposits & credits: $63,118.20 (42 deposits)
Total withdrawals & debits: $58,902.11
Ending balance: $22,456.64
Average daily balance: $19,830.00

Recurring debits:
  03/01  Loan payment - Equipment Finance Co     $1,950.00
  03/05  Commercial lease - Riverside Props       $4,200.00
  03/15  SBA EIDL repayment                         $487.00

Returned items / NSF:
  03/22  NSF fee - returned ACH                      $35.00
  03/29  NSF fee - returned check                    $35.00

Card deposits (Square): $41,002.18
Cash & check deposits: $22,116.02`;

async function main() {
  await prisma.application.deleteMany();

  await prisma.application.create({
    data: {
      businessName: "Maple & Co. Bakery LLC",
      applicantName: "Dana Whitfield",
      loanAmount: 120000,
      status: "INTAKE",
      auditLogs: {
        create: { actor: "system", action: "CREATED", detail: "Seeded sample application" },
      },
    },
  });

  console.log("Seeded one sample application. Open it and paste the sample statement to run extraction.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
