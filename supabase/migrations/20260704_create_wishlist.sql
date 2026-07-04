create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  title text not null,
  poster_url text,
  release_date text,
  created_at timestamptz default now()
);

alter table wishlist enable row level security;

create policy "all_can_read_wishlist" on wishlist
  for select using (true);

create policy "admin_can_write_wishlist" on wishlist
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
