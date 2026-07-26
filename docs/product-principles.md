# Mente Maestra
## Product Principles

Version: v0.1  
Status: Living Document

---

# Purpose

These are non-negotiable design and engineering principles for the Mente Maestra conversational product.

If a feature, UX pattern, or technical decision violates these principles, it should not ship.

They exist to keep the product simple for founders, coherent for the team, and compounding over time.

---

# Principles

## 1. Conversation First

The conversation is not a chat wrapper around forms.

The conversation **is** the database.

### Implications

- Every meaningful interaction must update memory.
- Prefer natural language over configuration screens.
- Forms, multiple choice, and visual references are allowed when they accelerate understanding — never when they replace context capture.
- UI state is secondary to conversational state.
- If the founder said it, the system should remember it.

### Anti-patterns

- Asking the same question again without reason
- Storing critical context only in ephemeral UI state
- Building dashboards that require re-entering what was already said in chat

---

## 2. Memory Compounds

Knowledge must grow continuously and become more valuable over time.

### Sources of memory

- Conversations
- Website
- CRM
- Meetings
- Fireflies transcripts
- Documents and PRDs
- Notes
- Emails
- Customer conversations
- Sales pipeline
- Marketing campaigns

### Implications

- Memory is editable by the user.
- Memory is mostly invisible until needed.
- The system should summarize, organize, and prioritize automatically.
- New information should reconcile with existing understanding, not append blindly.
- Deleting or correcting memory must be first-class.

### Anti-patterns

- Write-only logs with no synthesis
- Uneditable black-box “AI memory”
- Treating each session as a fresh start

---

## 3. Founder First

The primary user is a non-technical founder of a traditional service business (typically 5–30 employees).

### Implications

- Optimize for clarity, leverage, and confidence — not for power-user customization.
- Prefer one obvious path over many configuration options.
- Language should sound like a trusted operator, not like developer tooling.
- Reduce cognitive load at every step.
- Never force founders to assemble or manage an AI stack.

### Anti-patterns

- Multi-agent orchestration UIs
- Dense admin panels as the default experience
- Features that require technical setup to unlock value

---

## 4. Human Craftsmanship

AI replaces operational friction, not great design or strategy.

### Implications

- Humans still own websites, branding, creative direction, and high-judgment strategy.
- AI enables studio delivery; it does not fake craftsmanship.
- When the product surfaces creative or strategic work, preserve human quality bars.
- Automate prep, research, follow-up, and coordination before automating taste.

### Anti-patterns

- Shipping generic AI-generated brand systems as final deliverables
- Claiming full creative autonomy without human review
- Optimizing for volume of assets over quality of outcomes

---

## 5. One Face, Many Capabilities

Customers interact with one assistant personality.

Internally, multiple agents or tools may exist.

Externally, there is always one trusted face.

### Implications

- One persistent human name and voice.
- Internal routing, tools, and specialist agents stay invisible.
- Recommendations and actions should feel like they come from one coherent Chief of Staff.
- Personality consistency matters as much as capability breadth.

### Anti-patterns

- Exposing agent switchers to customers
- Fragmented tones across missions
- Making users choose which AI to talk to

---

## 6. Value or Understanding

Every interaction must either:

1. create immediate business value, or
2. improve the assistant’s understanding of the business.

### Implications

- Onboarding questions must earn their keep.
- Idle chatter without memory update or action is waste.
- Recommendations should be concrete and high-leverage.
- If a flow neither teaches the system nor moves the business, cut it.

### Anti-patterns

- Decorative AI responses with no write-back to memory
- Busywork checklists that do not change outcomes
- Endless clarification loops without progress

---

## 7. Missions Over Features

Customers do not buy feature lists.

They buy missions that produce outcomes.

### V1 mission

Lead Generation — validate the platform architecture.

### Implications

- Design around outcomes: ICP, prospects, outbound, follow-up, meetings.
- Reuse the same memory → understanding → strategy → execution architecture for future missions.
- Features exist to serve a mission, not the reverse.

### Anti-patterns

- Shipping disconnected tools (CRM, sequences, notes) without shared context
- Building platform primitives with no founder-facing outcome
- Optimizing for surface area over activation

---

## 8. Compete Against Complexity

We do not compete with HubSpot, Apollo, Clay, Salesforce, or Notion.

We compete against the cognitive load of assembling and operating them.

### Implications

- Default to managed, opinionated flows.
- Integrate systems behind the assistant instead of making founders become the integration layer.
- Prefer fewer decisions with better defaults.
- Complexity may exist internally; it must not leak into the founder experience.

### Anti-patterns

- “Connect 12 tools to get started”
- Empty states that dump configuration on the user
- Exposing internal pipeline complexity as product UX

---

## 9. Compounding Understanding Is the Moat

Our moat is not the model.

Our moat is accumulated operational knowledge of each business.

### Implications

- Invest in durable memory schemas, provenance, and correction loops.
- Make switching away feel costly because years of context would be lost.
- Continuously improve understanding quality (contradictions, priorities, risks, patterns).
- Treat business knowledge as the core asset of the product.

### Anti-patterns

- Stateless wrappers around a frontier model
- Memory that cannot be exported, inspected, or trusted
- Short-term hacks that corrupt long-term understanding

---

## 10. Architecture Follows the Loop

All product work should reinforce this loop:

```
Memory → Understanding → Strategy → Execution
```

### Implications

- Memory stores everything and stays user-editable.
- Understanding builds opinions, finds contradictions, and learns priorities.
- Strategy produces recommendations, roadmaps, campaigns, and opportunities.
- Execution launches missions (leads, campaigns, website projects, CRM updates, etc.).
- New capabilities should plug into this loop, not bypass it.

### Anti-patterns

- Execution without memory write-back
- Strategy without grounded understanding
- Dashboards that display data without improving decisions

---

# Design Rules for the Conversational Experience

1. **Under 5 minutes to first Living PRD** during onboarding.
2. Mix natural conversation with visual references and multiple choice when faster.
3. End conversations with a clear, logical list of highest-leverage next actions.
4. Prefer progressive disclosure: show only what the founder needs now.
5. Keep the assistant’s personality stable across missions and surfaces.
6. Make memory corrections easy and obvious.
7. Measure success by founder outcomes, not message count.

---

# Engineering Rules

1. Conversational writes are first-class persistence events.
2. Memory must support provenance (where a fact came from).
3. Prefer synthesis over raw accumulation.
4. External tools and agents are implementation details behind one assistant API/UX.
5. Mission modules share memory and understanding layers; they do not own isolated customer truth.
6. Billing, studio delivery, and platform usage may differ commercially — the founder still sees one product relationship.
7. Do not build non-goals into V1 (voice agents, phone calling, complex ERP, accounting, multi-agent orchestration UI, autonomous contract negotiation).

---

# Decision Test

Before shipping anything, ask:

1. Does this help a founder make a higher-leverage decision or take a higher-leverage action?
2. Does this improve durable business understanding?
3. Does this keep one coherent assistant face?
4. Does this reduce complexity instead of adding it?
5. Does this strengthen the memory → understanding → strategy → execution loop?

If the answer is no to all of the above, do not ship it.
