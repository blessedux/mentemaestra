-- Living PRD compile artifacts (Feature A / Ticket #5).
create table if not exists public.living_prds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  compiled_json jsonb not null,
  version int not null check (version > 0),
  created_at timestamptz not null default now()
);

create index if not exists living_prds_business_id_version_idx
  on public.living_prds (business_id, version desc);

-- Server-side only via service role (same pattern as sessions / facts).
alter table public.living_prds enable row level security;

comment on table public.living_prds is
  'Versioned Living PRD compiles. Access via service role only.';
