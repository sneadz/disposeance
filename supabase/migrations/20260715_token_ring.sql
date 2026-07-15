-- Jeton de l'Anneau Unique

alter table profiles add column if not exists can_use_token boolean not null default false;

alter table movies add column if not exists token_owner_id uuid references profiles(id);

create table if not exists token_spends (
  user_id uuid not null references profiles(id),
  quarter text not null,
  created_at timestamptz not null default now(),
  unique (user_id, quarter)
);

alter table token_spends enable row level security;

create policy "token_spends_readable_by_everyone" on token_spends
  for select using (true);
