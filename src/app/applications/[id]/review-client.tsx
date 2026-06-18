"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RatioResult } from "@/lib/ratios";

const SAMPLE = `RIVERSIDE COMMUNITY BANK
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

interface Field {
  id: string; key: string; label: string; value: string; unit: string | null;
  confidence: number; sourceQuote: string | null; verified: boolean;
}
interface AppData {
  id: string; businessName: string; applicantName: string; loanAmount: number | null;
  status: string; documents: { id: string; fileName: string }[]; fields: Field[];
  memo: { content: string } | null;
  auditLogs: { id: string; actor: string; action: string; detail: string | null; createdAt: string }[];
}

export default function ReviewClient({ app, ratios }: { app: AppData; ratios: RatioResult }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<Response>) {
    setBusy(label); setError(null);
    try {
      const res = await fn();
      if (!res.ok) throw new Error((await res.json()).error ?? "Request failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const extract = () =>
    run("extract", () =>
      fetch(`/api/applications/${app.id}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "pasted-statement.txt", rawText: text }),
      })
    );

  const genMemo = () =>
    run("memo", () => fetch(`/api/applications/${app.id}/memo`, { method: "POST" }));

  const patchField = (id: string, body: object) =>
    run("field-" + id, () =>
      fetch(`/api/fields/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
    );

  const dscr = ratios.dscr;
  const dscrColor = dscr === null ? "text-ink/50" : dscr >= 1.25 ? "text-accentdark" : "text-warn";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{app.businessName}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {app.applicantName}
            {app.loanAmount ? <> · requesting <span className="figure">${app.loanAmount.toLocaleString()}</span></> : null}
          </p>
        </div>
        <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-ink/70">{app.status}</span>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

      {/* Document intake */}
      <section className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Add bank statement</h2>
        <p className="mt-1 text-xs text-ink/50">Paste statement text, then run extraction. (PDF upload is the next build step.)</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste the applicant's bank statement text here…"
          className="mt-3 w-full rounded-md border border-black/15 bg-slatebg p-3 font-mono text-xs outline-none focus:border-accent"
        />
        <div className="mt-3 flex gap-2">
          <button onClick={() => setText(SAMPLE)} className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-slatebg">
            Load sample
          </button>
          <button
            onClick={extract}
            disabled={!text.trim() || busy === "extract"}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accentdark disabled:opacity-40"
          >
            {busy === "extract" ? "Extracting…" : "Run extraction"}
          </button>
        </div>
      </section>

      {/* Extracted fields */}
      {app.fields.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Extracted figures</h2>
          <div className="space-y-3">
            {app.fields.map((f) => (
              <FieldRow key={f.id} f={f} busy={busy === "field-" + f.id}
                onSave={(v) => patchField(f.id, { value: v })}
                onVerify={() => patchField(f.id, { verified: !f.verified })} />
            ))}
          </div>
        </section>
      )}

      {/* Underwriting metrics */}
      {app.fields.length > 0 && (
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Underwriting snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Est. annual revenue" value={`$${Math.round(ratios.estAnnualRevenue).toLocaleString()}`} />
            <Metric label="Annual cash flow" value={`$${Math.round(ratios.estAnnualCashFlow).toLocaleString()}`} />
            <Metric label="Total annual debt" value={`$${Math.round(ratios.totalAnnualDebt).toLocaleString()}`} />
            <Metric label="DSCR" value={dscr === null ? "—" : dscr.toFixed(2)} valueClass={dscrColor} />
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Illustrative assumptions: {ratios.assumptions.cashFlowMargin * 100}% cash-flow margin,
            {" "}{ratios.assumptions.aprPct}% APR, {ratios.assumptions.termMonths}-mo term. DSCR ≥ 1.25 is the typical bar.
          </p>
          <button
            onClick={genMemo}
            disabled={busy === "memo"}
            className="mt-4 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accentdark disabled:opacity-40"
          >
            {busy === "memo" ? "Drafting…" : app.memo ? "Regenerate credit memo" : "Generate credit memo"}
          </button>
        </section>
      )}

      {/* Memo */}
      {app.memo && (
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">Draft credit memo</h2>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/90">{app.memo.content}</pre>
        </section>
      )}

      {/* Audit trail */}
      {app.auditLogs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">Activity</h2>
          <ul className="space-y-1 text-xs text-ink/60">
            {app.auditLogs.map((l) => (
              <li key={l.id} className="flex gap-2">
                <span className="figure text-ink/40">{new Date(l.createdAt).toLocaleString()}</span>
                <span className="font-medium text-ink/70">{l.actor}</span>
                <span>{l.action}</span>
                {l.detail && <span className="text-ink/40">— {l.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-xs text-ink/50">{label}</div>
      <div className={`figure mt-0.5 text-lg font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function FieldRow({ f, busy, onSave, onVerify }: {
  f: Field; busy: boolean; onSave: (v: string) => void; onVerify: () => void;
}) {
  const [val, setVal] = useState(f.value);
  const dirty = val !== f.value;
  const pct = Math.round(f.confidence * 100);
  const low = f.confidence < 0.6;

  return (
    <div className={`rounded-lg border bg-white p-4 ${f.verified ? "border-accent/40" : "border-black/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{f.label}</div>
          <div className="mt-1 flex items-center gap-2">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="figure w-32 rounded border border-black/15 px-2 py-1 text-sm outline-none focus:border-accent"
            />
            <span className="text-xs text-ink/40">{f.unit}</span>
            {dirty && (
              <button onClick={() => onSave(val)} disabled={busy} className="text-xs font-medium text-accent hover:underline">
                Save
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${low ? "text-warn" : "text-ink/50"}`}>{pct}% conf.</span>
          <button
            onClick={onVerify}
            disabled={busy}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              f.verified ? "bg-accent text-white" : "border border-black/15 text-ink/70 hover:bg-slatebg"
            }`}
          >
            {f.verified ? "Verified" : "Verify"}
          </button>
        </div>
      </div>
      {f.sourceQuote && (
        <p className="mt-2 border-l-2 border-black/10 pl-2 font-mono text-xs text-ink/50">{f.sourceQuote}</p>
      )}
    </div>
  );
}
