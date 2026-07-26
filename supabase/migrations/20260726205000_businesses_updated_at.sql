-- Expand businesses for AuthBridge soft-save (Feature A / Ticket #7).
alter table public.businesses
  add column if not exists updated_at timestamptz not null default now();

comment on column public.businesses.updated_at is
  'Last update timestamp; set when AuthBridge creates or rebinds ownership.';
