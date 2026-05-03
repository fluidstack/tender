# TenderAI

AI-powered tender response platform for Australian businesses bidding on government tenders.

## Stack
- **Frontend**: React + Vite (artifacts/tenderai), Wouter, TanStack Query, shadcn/ui, Tailwind v4
- **API**: Express 5 (artifacts/api-server) on /api
- **Auth**: Clerk (Replit-managed)
- **DB**: Postgres + Drizzle (lib/db) — profile, tenders, documents, requirements, compliance, risks, drafts, activity tables
- **AI**: Replit AI integrations OpenAI proxy (gpt-5.4) — `aiJson`/`aiText` helpers
- **Storage**: Object storage for tender docs (PDF/DOCX, parsed via pdf-parse/mammoth)
- **Export**: docx + pdfkit for response export

## Features (v1)
- Business profile builder (company details, capabilities, staff, past performance, certs, compliance statements) with completeness score
- Tender CRUD + 3 auto-seeded sample tenders on first dashboard load
- Document upload, sync parse, requirements extraction (AI)
- Compliance gap analysis (AI)
- Contract risk analysis (AI)
- 9-section AI-drafted response with editor + DOCX/PDF export
- Dashboard with stats, deadlines, activity

## Notes
- Sample tenders seed lazily per user via `seedSampleTendersForUser` on GET /api/dashboard/summary
- Single-user v1 — no AusTender, no Stripe
- Clerk uses publishableKeyFromHost(hostname, fallback) so dev test key works
