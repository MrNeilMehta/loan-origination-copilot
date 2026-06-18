# Loan Origination Copilot

A small, working slice of AI-assisted small-business loan origination: upload a
bank statement, have a model extract the key underwriting figures *with a source
quote and confidence score for every value*, let a human verify or correct each
one, compute a debt-service-coverage ratio, and generate a draft credit memo.

Built to mirror the actual problem Casca works on — collapsing the manual,
multi-week underwriting workflow — on a scope you can stand up in a weekend.

## Why it's shaped this way

The hard part of AI in a bank isn't the model call. It's **trust**: an
underwriter won't act on a number they can't trace, and a regulator won't accept
a decision with no record. So three things are load-bearing here, not optional:

- **Traceability** — every extracted value stores the verbatim snippet it came from.
- **Human-in-the-loop** — nothing is treated as fact until a person verifies it; low-confidence values are flagged.
- **Audit trail** — every extraction, edit, and memo generation is logged.

These are the choices that separate "an LLM demo" from "software a bank could use."

## Stack

Next.js (App Router) · TypeScript · React · Postgres + Prisma · Anthropic API.
(Maps directly to Casca's listed stack.)

## Run it

```bash
# 1. Start Postgres (or point DATABASE_URL at Neon / Supabase / local pg)
docker compose up -d

# 2. Configure env
cp .env.example .env
#    -> paste your ANTHROPIC_API_KEY from https://console.anthropic.com

# 3. Install + set up the database
npm install
npm run db:push      # create tables
npm run db:seed      # one sample application

# 4. Go
npm run dev          # http://localhost:3000
```

Open the seeded application, click **Load sample**, then **Run extraction** to see
the whole pipeline end to end without needing a real PDF.

## How it flows

```
New application  ->  Add statement text  ->  AI extraction (per-field source + confidence)
      ->  Human verifies / edits each field  ->  Ratios computed (DSCR)
      ->  Draft credit memo generated  ->  every step written to the audit log
```

Key files to read first:
- `src/lib/extract.ts` — the extraction prompt + normalization (the core)
- `src/lib/ratios.ts` — underwriting math, with assumptions made explicit
- `src/app/applications/[id]/review-client.tsx` — the review UI

## Weekend plan (suggested)

**Day 1** — get the happy path solid: run it, swap in 2–3 real (anonymized) bank
statement samples, tighten the extraction prompt against them.
**Day 2** — pick ONE upgrade below, then write the field notes + record a 2-min demo.

Natural next steps (don't do all of them — shipping one well beats five half-built):
- Real PDF upload (drop a file input + `pdf-parse` in the documents route).
- Highlight the source quote inside the original document text.
- A "missing documents" completeness check (tax return present? statements for N months?).
- Multi-statement support and trend-over-time (revenue stability is a real underwriting signal).

## Field notes (fill this in — it's the most important part)

This is what makes you read as a *forward deployed* engineer rather than someone
who built another CRUD app. Before or after building, spend 30–60 minutes learning
how SMB loan underwriting actually works (read about SBA 7(a) underwriting, or
better, talk to anyone you know in lending). Then write 4–5 sentences here:

> **How the work is done today:** ...
> **The bottlenecks I found:** ...
> **What I built to address them, and what I deliberately left to the human:** ...
> **What I'd want to learn from a real underwriter next:** ...

In an interview, walk through this first, then the demo. The point you're proving
is exactly the one in the job description: deep empathy for the user *plus* the
ability to build.

## A note for the interview

Be ready to say what you'd do differently for production: data handling and PII,
per-customer prompt tuning, evals on extraction accuracy, and never auto-approving.
Showing you know where the edges are matters more than feature count.
