create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false)
     or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

create table if not exists site_settings (
  id int primary key default 1,
  name text not null default '',
  domain text not null default '',
  data jsonb not null default '{}'::jsonb
);
alter table site_settings enable row level security;
create policy site_settings_read on site_settings for select using (true);
create policy site_settings_write on site_settings for all using (is_admin()) with check (is_admin());

create table if not exists cms_settings (
  plugin text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  primary key (plugin, key)
);
alter table cms_settings enable row level security;
create policy cms_settings_read on cms_settings for select using (true);
create policy cms_settings_write on cms_settings for all using (is_admin()) with check (is_admin());
