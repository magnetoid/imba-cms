-- ═══════════════════════════════════════════════════════════
--  core · V006 — capability model in SQL
-- ═══════════════════════════════════════════════════════════
--
-- Mirrors ROLE_CAPABILITIES from packages/core/src/permissions.ts into the
-- database, so RLS can answer the same question the admin UI answers.
--
-- Until now the two disagreed. `plugin-pages`, `plugin-projects` and
-- `plugin-site` gate writes on `is_admin()`, which after V005 resolves only
-- super_admin and the JWT admin markers — while the admin UI shows their
-- editors to anyone holding `<entity>.write`. A content_admin or editor could
-- open the Pages editor, make a change, hit save, and have the write silently
-- rejected by RLS with no error surfaced. V002 of each of those plugins moves
-- them onto `has_capability()`.
--
-- The table is encoded as a CASE rather than a capabilities join table on
-- purpose: a parity test (V006_capabilities.test.ts) parses these arms and
-- asserts set-equality against the TypeScript table, so the two cannot drift.
-- A join table would move the source of truth into data, where no test can see
-- it and a migration would have to keep it in sync.
--
-- Additive only: creates functions, drops nothing.

create or replace function public.role_capabilities(p_role text)
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_role
    when 'super_admin' then array[
      'site.read','site.write','site.publish',
      'pages.read','pages.write','pages.publish',
      'projects.read','projects.write','projects.publish',
      'blog.read','blog.write','blog.write.any','blog.publish','blog.delete','blog.seed',
      'blog.categories.manage',
      'media.read','media.write',
      'settings.manage','automation.manage','users.manage','audit.read'
    ]
    when 'content_admin' then array[
      'site.read','site.write','site.publish',
      'pages.read','pages.write','pages.publish',
      'projects.read','projects.write','projects.publish',
      'blog.read','blog.write','blog.write.any','blog.publish','blog.delete','blog.seed',
      'blog.categories.manage',
      'media.read','media.write',
      'audit.read'
    ]
    when 'editor' then array[
      'site.read',
      'pages.read','pages.write','pages.publish',
      'projects.read','projects.write','projects.publish',
      'blog.read','blog.write','blog.write.any','blog.publish','blog.categories.manage',
      'media.read','media.write'
    ]
    when 'author' then array[
      'site.read',
      'pages.read',
      'projects.read',
      'blog.read','blog.write',
      'media.read','media.write'
    ]
    when 'reviewer' then array[
      'site.read',
      'pages.read','pages.publish',
      'projects.read','projects.publish',
      'blog.read','blog.publish',
      'media.read'
    ]
    when 'media_manager' then array[
      'media.read','media.write'
    ]
    else array[]::text[]
  end;
$$;

-- SECURITY DEFINER for the same reason V005 elevated is_admin/has_role: this
-- reads cms_user_roles, and a policy ON cms_user_roles that called an
-- invoker-rights version would re-enter that table's own policy and raise
-- "infinite recursion detected in policy for relation cms_user_roles".
-- search_path is pinned so the definer's rights cannot be redirected.
--
-- Mirrors resolveCapabilities(): JWT admin markers, then the role's array, then
-- explicit app_metadata.permissions grants (which is how the MCP server's
-- service identity is scoped).
create or replace function public.has_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((auth.jwt() ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() ->> 'role') = 'service_role', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or lower(p_capability) = any(
         public.role_capabilities(
           (select role from public.cms_user_roles where user_id = auth.uid())))
    or exists (
         select 1
         from jsonb_array_elements_text(
                case
                  when jsonb_typeof(auth.jwt() -> 'app_metadata' -> 'permissions') = 'array'
                    then auth.jwt() -> 'app_metadata' -> 'permissions'
                  else '[]'::jsonb
                end) as granted(value)
         where lower(granted.value) = lower(p_capability));
$$;

revoke all on function public.role_capabilities(text) from public;
revoke all on function public.has_capability(text) from public;
grant execute on function public.role_capabilities(text) to anon, authenticated, service_role;
grant execute on function public.has_capability(text) to anon, authenticated, service_role;
