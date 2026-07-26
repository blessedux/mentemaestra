-- MemoryFacts: durable atoms of business understanding (Feature A / Ticket #4).
create table if not exists public.memory_facts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  session_id uuid not null references public.sessions (id) on delete cascade,
  key text not null,
  value text not null,
  category text not null check (
    category in ('business', 'customers', 'brand', 'goals', 'pain', 'visual')
  ),
  provenance_type text not null check (
    provenance_type in ('message', 'chip', 'user_edit')
  ),
  provenance_id text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, key)
);

create index if not exists memory_facts_session_id_idx
  on public.memory_facts (session_id);

create index if not exists memory_facts_business_id_idx
  on public.memory_facts (business_id);

-- Server-side only via service role (same pattern as sessions / turns).
alter table public.memory_facts enable row level security;

comment on table public.memory_facts is
  'Session-scoped business facts with provenance. Access via service role only.';
