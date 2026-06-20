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


