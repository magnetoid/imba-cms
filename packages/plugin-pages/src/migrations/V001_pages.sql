create table if not exists pages_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text not null default '',
  seo_description text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create or replace function touch_pages_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pages_entries_touch_updated_at on pages_entries;
create trigger pages_entries_touch_updated_at
before update on pages_entries
for each row
execute function touch_pages_entries_updated_at();

alter table pages_entries enable row level security;

drop policy if exists pages_entries_read on pages_entries;
create policy pages_entries_read on pages_entries
for select using (true);

drop policy if exists pages_entries_write on pages_entries;
create policy pages_entries_write on pages_entries
for all using (is_admin()) with check (is_admin());
