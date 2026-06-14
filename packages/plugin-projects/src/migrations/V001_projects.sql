create table if not exists projects_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  url text not null default '',
  year text not null default '',
  category text not null default '',
  tagline text not null default '',
  hero text not null default '',
  summary text not null default '',
  accent text not null default '#10B981',
  featured boolean not null default false,
  sort_order integer not null default 999,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text not null default '',
  seo_description text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create or replace function touch_projects_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_entries_touch_updated_at on projects_entries;
create trigger projects_entries_touch_updated_at
before update on projects_entries
for each row
execute function touch_projects_entries_updated_at();

create index if not exists projects_entries_sort_order_idx on projects_entries(sort_order);
create index if not exists projects_entries_status_idx on projects_entries(status);

alter table projects_entries enable row level security;

drop policy if exists projects_entries_read on projects_entries;
create policy projects_entries_read on projects_entries
for select using (true);

drop policy if exists projects_entries_write on projects_entries;
create policy projects_entries_write on projects_entries
for all using (is_admin()) with check (is_admin());
