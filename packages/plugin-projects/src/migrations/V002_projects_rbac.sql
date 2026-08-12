-- ═══════════════════════════════════════════════════════════
--  plugin-projects · V002 — capability-based RLS
-- ═══════════════════════════════════════════════════════════
--
-- Fixes two defects in V001.
--
-- 1. Writes were gated on `is_admin()`, which after core V005 resolves only
--    super_admin and the JWT admin markers. The admin UI, meanwhile, shows the
--    projects editor to anyone holding `projects.write`. So a content_admin or
--    editor could open it, make a change, hit save — and have the write
--    silently rejected by RLS. Now gated on `has_capability()` (core V006),
--    which mirrors the same ROLE_CAPABILITIES table the UI reads.
--
-- 2. `projects_entries_read` was `using (true)`, publishing every **draft** row to
--    anyone holding the public anon key. Reads now split: anonymous callers see
--    published rows only, staff holding `projects.read` see everything.
--
-- Additive only: replaces policies, drops no table, column or row.

drop policy if exists projects_entries_read on projects_entries;
drop policy if exists projects_entries_write on projects_entries;

-- Public surface: published rows only.
drop policy if exists projects_entries_public_read on projects_entries;
create policy projects_entries_public_read on projects_entries
for select to anon, authenticated
using (status = 'published');

-- Staff surface: drafts included. OR'd with the policy above, so a staff member
-- sees both.
drop policy if exists projects_entries_staff_read on projects_entries;
create policy projects_entries_staff_read on projects_entries
for select to authenticated
using (public.has_capability('projects.read'));

drop policy if exists projects_entries_insert on projects_entries;
create policy projects_entries_insert on projects_entries
for insert to authenticated
with check (public.has_capability('projects.write'));

-- Publishing is a status transition, so `projects.publish` also permits update.
-- A reviewer holds publish without write and must still be able to act.
drop policy if exists projects_entries_update on projects_entries;
create policy projects_entries_update on projects_entries
for update to authenticated
using (public.has_capability('projects.write') or public.has_capability('projects.publish'))
with check (public.has_capability('projects.write') or public.has_capability('projects.publish'));

drop policy if exists projects_entries_delete on projects_entries;
create policy projects_entries_delete on projects_entries
for delete to authenticated
using (public.has_capability('projects.write'));
