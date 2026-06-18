import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  INTAKE: "bg-black/5 text-ink/70",
  NEEDS_REVIEW: "bg-amber-100 text-warn",
  REVIEWED: "bg-teal-50 text-accentdark",
  DECISIONED: "bg-teal-600 text-white",
};

const STATUS_LABEL: Record<string, string> = {
  INTAKE: "Intake",
  NEEDS_REVIEW: "Needs review",
  REVIEWED: "Reviewed",
  DECISIONED: "Decisioned",
};

export default async function Dashboard() {
  const apps = await prisma.application.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { documents: true, fields: true } }, memo: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Loan pipeline</h1>
        <p className="mt-1 text-sm text-ink/60">
          {apps.length} application{apps.length === 1 ? "" : "s"}. Each one carries its
          documents, AI-extracted figures, and review status.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="text-ink/70">No applications yet.</p>
          <Link href="/applications/new" className="mt-3 inline-block text-accent hover:underline">
            Add your first application
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Docs / Fields</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-slatebg">
                  <td className="px-4 py-3">
                    <Link href={`/applications/${a.id}`} className="font-medium text-accent hover:underline">
                      {a.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{a.applicantName}</td>
                  <td className="figure px-4 py-3 text-ink/70">
                    {a.loanAmount ? `$${a.loanAmount.toLocaleString()}` : "—"}
                  </td>
                  <td className="figure px-4 py-3 text-ink/60">
                    {a._count.documents} / {a._count.fields}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
