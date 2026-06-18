"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewApplication() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, applicantName, loanAmount }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not create application.");
      const app = await res.json();
      router.push(`/applications/${app.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  const ready = businessName.trim() && applicantName.trim();

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">New application</h1>
      <p className="mt-1 text-sm text-ink/60">
        Create the file, then add the applicant&apos;s bank statement to run extraction.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Business name">
          <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Maple & Co. Bakery LLC" />
        </Field>
        <Field label="Applicant name">
          <input className={inputCls} value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Dana Whitfield" />
        </Field>
        <Field label="Requested amount (USD)">
          <input className={inputCls} value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} inputMode="numeric" placeholder="120000" />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={create}
          disabled={!ready || saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentdark disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create application"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}
