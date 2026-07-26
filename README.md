# Mente Maestra

AI Chief of Staff for founder-led service businesses.

This repository is the codebase for the **conversational product experience** — the AI-powered Business Operating System where conversation is the database, memory compounds over time, and missions (starting with Lead Generation) create measurable growth.

The marketing website is the onboarding surface. This app is the product.

---

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Vercel AI SDK
- Supabase Auth + Postgres
- Zod
- Vitest
- Bun

## Setup

```bash
bun install
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
bun run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run test` | Vitest |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint |

## Domain glossary

See [CONTEXT.md](./CONTEXT.md) for Mission, MemoryFact, Living PRD, Maya, Business, Session, and the deep modules (OnboardingPolicy, AuthBridge, SessionOrchestrator, MemoryWriter, LivingPrdCompiler, ConversationRuntime).

---

## Product docs

| Document | Purpose |
| --- | --- |
| [CONTEXT.md](./CONTEXT.md) | Domain glossary shared across tickets |
| [docs/business-vision.md](./docs/business-vision.md) | Why the company exists and its long-term direction |
| [docs/product-principles.md](./docs/product-principles.md) | Non-negotiable design and engineering principles |
| [docs/prd-v1-ai-chief-of-staff.md](./docs/prd-v1-ai-chief-of-staff.md) | What to build next and how success is measured |

---

## North Star

Every interaction should either create value or improve understanding of the business.
