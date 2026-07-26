# Mente Maestra — Domain Context

Shared vocabulary for the conversational product. Later tickets should use these terms as written.

## Product entities

### Mission

The founder's immediate goal for the session — one of `leads`, `website`, `marketing`, `sales`, or `strategy`. A mission focuses Maya's questions and the Living PRD without locking the founder into a permanent mode.

### MemoryFact

A single piece of business knowledge with `key`, `value`, `category`, `provenance`, and `confidence`. Facts are the durable atoms of understanding; every meaningful turn should write or update them.

### Living PRD

A structured, editable document compiled from MemoryFacts using a Zod schema (business name, ICP, goals, pain points, brand notes, mission, visual preferences). It recompiles when facts change and is the artifact the founder saves.

### Maya

The AI Chief of Staff assistant. Warm, natural Colombian Spanish; charismatic and strategic. She is the single personality the founder talks to — internal tools and agents stay invisible.

### Business

The founder's company record: name, owning user (`created_by`), accumulated memory, and Living PRD. Created or bound when AuthBridge completes the soft save gate.

### Session

An anonymous or authenticated conversation identified by a secure cookie token and an optional mission. Sessions hold turns and session-scoped MemoryFacts until they merge into a Business.

## Deep modules

### OnboardingPolicy

Decides what business context is still missing, when the Living PRD is "ready" to show, and keeps the conversational path under ~5 minutes by prioritizing high-signal questions.

### AuthBridge

Soft-gates the "save" action with Supabase auth (magic link or Google OAuth), creates or fetches the Business, and merges the anonymous Session into durable ownership.

### SessionOrchestrator

Creates Sessions, attaches missions, manages cookie tokens/expiry, and merges anonymous sessions into authenticated Businesses.

### MemoryWriter

Upserts MemoryFacts with provenance from conversation turns (`message`), choice chips (`chip`), or founder edits (`user_edit`). Deduplicates by key and updates timestamps.

### LivingPrdCompiler

Reads MemoryFacts, validates/compiles them into a Zod Living PRD, and recompiles when facts or user edits change.

### ConversationRuntime

Wraps the Vercel AI SDK streaming chat with Maya's system prompt and structured-output tools for MemoryFact extraction. Persists conversation turns.

## Product principles (summary)

1. **Conversation is the database** — every meaningful turn writes MemoryFacts or updates the PRD.
2. **Memory compounds** — facts have provenance, are editable, and recompile the PRD.
3. **Founder First** — optimize for clarity, leverage, and confidence.
4. **One Face** — Maya is the only personality; tools stay invisible.
5. **Value or Understanding** — every interaction creates value or improves business understanding.
