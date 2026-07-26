-- Conversation turns for Maya chat (Feature A / Ticket #3).
create table if not exists public.conversation_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversation_turns_session_id_created_at_idx
  on public.conversation_turns (session_id, created_at);

-- Server-side only via service role (same pattern as sessions).
alter table public.conversation_turns enable row level security;

comment on table public.conversation_turns is
  'Chat turns for anonymous sessions. Access via service role only.';
