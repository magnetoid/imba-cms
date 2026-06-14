create table if not exists site_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Public Site',
  status text not null default 'draft' check (status in ('draft', 'published')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create or replace function touch_site_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_entries_touch_updated_at on site_entries;
create trigger site_entries_touch_updated_at
before update on site_entries
for each row
execute function touch_site_entries_updated_at();

alter table site_entries enable row level security;

drop policy if exists site_entries_read on site_entries;
create policy site_entries_read on site_entries
for select using (true);

drop policy if exists site_entries_write on site_entries;
create policy site_entries_write on site_entries
for all using (is_admin()) with check (is_admin());
