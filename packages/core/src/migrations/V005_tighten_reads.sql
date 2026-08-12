-- Tightens two policies that were created with `using (true)`, making them
-- readable by the `anon` role — i.e. by anyone on the internet holding only the
-- public anon key.
--
--   * cms_user_roles : leaked the full user_id -> role map (who your admins are)
--   * cms_settings   : leaked every non-secret plugin setting
--
-- `site_settings` deliberately keeps its public read policy: the public site
-- frontend reads it anonymously by design.
--
-- Additive only: this drops and recreates policies and functions, never a table,
-- column or row.

-- `is_admin()` and `get_current_role()` both read cms_user_roles. Any policy ON
-- cms_user_roles that calls them would make Postgres re-enter that table's own
-- policy and raise "infinite recursion detected in policy for relation
-- cms_user_roles". Marking them SECURITY DEFINER lets them read the table
-- directly, which both removes the recursion hazard (the existing
-- cms_user_roles_write policy already had it) and keeps them correct once the
-- read policy below stops being universally permissive.
--
-- Safe to elevate: neither takes an argument, and both are scoped to the
-- caller's own row via auth.uid(). search_path is pinned so the definer's rights
-- cannot be redirected to an attacker-controlled schema.
create or replace function get_current_role() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select role from cms_user_roles where user_id = auth.uid();
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false)
     or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
     or (select role from cms_user_roles where user_id = auth.uid()) = 'super_admin';
$$;

create or replace function has_role(allowed_roles text[]) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select (select role from cms_user_roles where user_id = auth.uid()) = any(allowed_roles) or is_admin();
$$;

-- A user may read their own role row. Broader visibility is deliberately
-- restricted to the JWT-level admin markers, which need no table lookup — the
-- forthcoming user-management UI reads through the service role, which bypasses
-- RLS entirely, so it does not need a table-derived super_admin clause here.
drop policy if exists cms_user_roles_read on cms_user_roles;
create policy cms_user_roles_read on cms_user_roles for select using (
  user_id = auth.uid()
  or coalesce((auth.jwt() ->> 'role') = 'admin', false)
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

-- Plugin settings are operational configuration, not public content.
drop policy if exists cms_settings_read on cms_settings;
create policy cms_settings_read on cms_settings for select using (auth.uid() is not null);
