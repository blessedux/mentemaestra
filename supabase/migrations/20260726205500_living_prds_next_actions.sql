-- Persist Maya closeout next-actions on the Living PRD (Feature A / Ticket #9).
alter table public.living_prds
  add column if not exists next_actions jsonb;

comment on column public.living_prds.next_actions is
  'Structured closeout next actions generated when onboarding is ready and PRD is saved.';
