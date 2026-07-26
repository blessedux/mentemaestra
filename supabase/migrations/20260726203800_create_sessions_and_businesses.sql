-- businesses (minimal): sessions.business_id FK target.
-- Full Business fields arrive with AuthBridge / later tickets.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Anonymous / authenticated conversation sessions (cookie-token keyed).
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  cookie_token text not null unique,
  mission text check (
    mission is null
    or mission in ('leads', 'website', 'marketing', 'sales', 'strategy')
  ),
  business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_cookie_token_idx
  on public.sessions (cookie_token);

create index if not exists sessions_expires_at_idx
  on public.sessions (expires_at);

-- Server-side only: enable RLS with no public policies.
-- The app reads/writes sessions via the service-role key in server
-- actions / route handlers (bypasses RLS). Anon and authenticated
-- clients must not query these tables directly.
alter table public.businesses enable row level security;
alter table public.sessions enable row level security;

comment on table public.sessions is
  'Anonymous sessions keyed by httpOnly cookie token. Access via service role only.';
comment on table public.businesses is
  'Founder business records. Minimal scaffold; expanded by AuthBridge.';
