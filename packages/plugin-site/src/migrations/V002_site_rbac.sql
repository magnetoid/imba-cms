-- ═══════════════════════════════════════════════════════════
--  plugin-site · V002 — capability-based RLS
-- ═══════════════════════════════════════════════════════════
--
-- Fixes two defects in V001.
--
-- 1. Writes were gated on `is_admin()`, which after core V005 resolves only
--    super_admin and the JWT admin markers. The admin UI, meanwhile, shows the
--    site editor to anyone holding `site.write`. So a content_admin or
--    editor could open it, make a change, hit save — and have the write
--    silently rejected by RLS. Now gated on `has_capability()` (core V006),
--    which mirrors the same ROLE_CAPABILITIES table the UI reads.
--
-- 2. `site_entries_read` was `using (true)`, publishing every **draft** row to
--    anyone holding the public anon key. Reads now split: anonymous callers see
--    published rows only, staff holding `site.read` see everything.
--
-- Additive only: replaces policies, drops no table, column or row.

drop policy if exists site_entries_read on site_entries;
drop policy if exists site_entries_write on site_entries;

-- Public surface: published rows only.
drop policy if exists site_entries_public_read on site_entries;
create policy site_entries_public_read on site_entries
for select to anon, authenticated
using (status = 'published');

-- Staff surface: drafts included. OR'd with the policy above, so a staff member
-- sees both.
drop policy if exists site_entries_staff_read on site_entries;
create policy site_entries_staff_read on site_entries
for select to authenticated
using (public.has_capability('site.read'));

drop policy if exists site_entries_insert on site_entries;
create policy site_entries_insert on site_entries
for insert to authenticated
with check (public.has_capability('site.write'));

-- Publishing is a status transition, so `site.publish` also permits update.
-- A reviewer holds publish without write and must still be able to act.
drop policy if exists site_entries_update on site_entries;
create policy site_entries_update on site_entries
for update to authenticated
using (public.has_capability('site.write') or public.has_capability('site.publish'))
with check (public.has_capability('site.write') or public.has_capability('site.publish'));

drop policy if exists site_entries_delete on site_entries;
create policy site_entries_delete on site_entries
for delete to authenticated
using (public.has_capability('site.write'));
