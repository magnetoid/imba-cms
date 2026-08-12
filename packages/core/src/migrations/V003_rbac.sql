create table if not exists cms_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'content_admin', 'editor', 'author', 'reviewer', 'media_manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cms_user_roles enable row level security;

create or replace function get_current_role() returns text
language sql stable as $$
  select role from cms_user_roles where user_id = auth.uid();
$$;

create policy cms_user_roles_read on cms_user_roles for select using (true);
create policy cms_user_roles_write on cms_user_roles for all using (
  coalesce((auth.jwt() ->> 'role') = 'admin', false)
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  or get_current_role() = 'super_admin'
);

create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false)
     or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
     or (select role from cms_user_roles where user_id = auth.uid()) = 'super_admin';
$$;

create or replace function has_role(allowed_roles text[]) returns boolean
language sql stable as $$
  select (select role from cms_user_roles where user_id = auth.uid()) = any(allowed_roles) or is_admin();
$$;

-- Trigger for updated_at
create or replace function touch_cms_user_roles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cms_user_roles_touch_updated_at on cms_user_roles;
create trigger cms_user_roles_touch_updated_at
before update on cms_user_roles
for each row
execute function touch_cms_user_roles_updated_at();
