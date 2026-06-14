create table if not exists cms_private_settings (
  scope text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, key)
);

create or replace function touch_cms_private_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cms_private_settings_touch_updated_at on cms_private_settings;
create trigger cms_private_settings_touch_updated_at
before update on cms_private_settings
for each row
execute function touch_cms_private_settings_updated_at();

alter table cms_private_settings enable row level security;
create policy cms_private_settings_read on cms_private_settings for select using (is_admin());
create policy cms_private_settings_write on cms_private_settings for all using (is_admin()) with check (is_admin());
