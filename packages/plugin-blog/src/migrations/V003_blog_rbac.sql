-- ═══════════════════════════════════════════════════════════
--  plugin-blog · V003 — ownership and per-operation authorization
-- ═══════════════════════════════════════════════════════════
--
-- V001 gated blog_posts with a single FOR ALL policy across five roles:
--
--   USING (has_role(ARRAY['super_admin','content_admin','editor','author','reviewer']))
--
-- So an `author` could edit anyone's post, a `reviewer` could rewrite bodies
-- rather than just approve them, and `blog.delete` was not distinguished at all
-- — every role that could write could also delete.
--
-- Two changes fix that: posts get a real owner, and the policy splits per
-- operation against core V006's has_capability().
--
-- Additive only: adds a column default, replaces a function and policies.

-- ── Ownership ──────────────────────────────────────────────
-- author_id existed since V001 but was never written: BlogPostEdit does not set
-- it, so no post has an owner and no ownership rule could be enforced. A column
-- default plus the trigger below (which covers writes that pass an explicit
-- NULL) closes that.
--
-- Existing rows keep author_id NULL, which reads as *unowned*: editable only
-- with blog.write.any. Deliberately not backfilled — a backfill from
-- blog_post_revisions.actor_id is possible later and is itself additive.
alter table public.blog_posts alter column author_id set default auth.uid();

create index if not exists blog_posts_author_id_idx on public.blog_posts (author_id);

-- ── Workflow trigger, extended ─────────────────────────────
-- Redefined wholesale (create or replace) rather than patched, so this file is
-- the complete current definition. Only the INSERT ownership block is new; the
-- status normalization is byte-identical to V002.
create or replace function public.normalize_blog_post_workflow()
returns trigger
language plpgsql
as $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
  next_status TEXT := COALESCE(NEW.status, 'draft');
BEGIN
  NEW.updated_at := now_ts;

  IF TG_OP = 'INSERT' THEN
    NEW.author_id := COALESCE(NEW.author_id, auth.uid());
  END IF;

  IF next_status = 'scheduled' AND NEW.scheduled_for IS NOT NULL AND NEW.scheduled_for <= now_ts THEN
    next_status := 'published';
  END IF;

  IF next_status = 'published' OR COALESCE(NEW.published, false) THEN
    NEW.status := 'published';
    NEW.published := true;
    NEW.published_at := COALESCE(NEW.published_at, now_ts);
    NEW.first_published_at := COALESCE(NEW.first_published_at, NEW.published_at);
    NEW.scheduled_for := NULL;
  ELSIF next_status = 'scheduled' THEN
    NEW.status := 'scheduled';
    NEW.published := false;
    NEW.published_at := NULL;
    NEW.scheduled_for := COALESCE(NEW.scheduled_for, now_ts);
  ELSE
    NEW.status := next_status;
    NEW.published := false;
    NEW.published_at := NULL;
    NEW.scheduled_for := NULL;
  END IF;

  IF NEW.status IN ('approved', 'published') THEN
    NEW.last_reviewed_at := COALESCE(NEW.last_reviewed_at, now_ts);
  END IF;

  RETURN NEW;
END;
$$;

-- ── Per-operation policies ─────────────────────────────────
drop policy if exists "admin_all_blog_posts" on public.blog_posts;

-- Staff read, including drafts. Required as its own policy: V002 narrowed
-- public_read_blog_posts to published rows only, so without this the dropped
-- FOR ALL policy above was the only thing letting staff see their own drafts.
drop policy if exists blog_posts_staff_read on public.blog_posts;
create policy blog_posts_staff_read on public.blog_posts
for select to authenticated
using (public.has_capability('blog.read'));

drop policy if exists blog_posts_insert on public.blog_posts;
create policy blog_posts_insert on public.blog_posts
for insert to authenticated
with check (
  public.has_capability('blog.write')
  and (public.has_capability('blog.write.any') or author_id = auth.uid())
);

-- An author may edit only their own post; blog.write.any lifts that.
-- NULL author_id (pre-V003 rows) is unowned and needs blog.write.any.
drop policy if exists blog_posts_update on public.blog_posts;
create policy blog_posts_update on public.blog_posts
for update to authenticated
using (
  public.has_capability('blog.write.any')
  or (public.has_capability('blog.write') and author_id = auth.uid())
)
with check (
  public.has_capability('blog.write.any')
  or (public.has_capability('blog.write') and author_id = auth.uid())
);

drop policy if exists blog_posts_delete on public.blog_posts;
create policy blog_posts_delete on public.blog_posts
for delete to authenticated
using (public.has_capability('blog.delete'));

-- ── Reviewer publishing ────────────────────────────────────
-- A reviewer holds blog.publish but not blog.write: they approve what others
-- wrote and must not edit the body. RLS cannot express that, because policies
-- gate rows, not columns — an UPDATE policy permissive enough to change status
-- is permissive enough to rewrite everything.
--
-- So publishing goes through a narrow SECURITY DEFINER function that touches
-- only the workflow columns. The BEFORE trigger above still normalizes the
-- timestamps and the AFTER trigger still writes the revision and audit rows,
-- so this adds no bookkeeping of its own.
create or replace function public.blog_set_post_status(
  p_post_id uuid,
  p_status text,
  p_scheduled_for timestamptz default null
)
returns public.blog_posts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner uuid;
  result public.blog_posts;
begin
  if p_status not in ('draft','in_review','approved','scheduled','published','archived') then
    raise exception 'invalid blog post status: %', p_status using errcode = '22023';
  end if;

  select author_id into owner from public.blog_posts where id = p_post_id;
  if not found then
    raise exception 'blog post % not found', p_post_id using errcode = 'P0002';
  end if;

  if p_status in ('published','scheduled','approved') then
    if not public.has_capability('blog.publish') then
      raise exception 'blog.publish is required to set status %', p_status using errcode = '42501';
    end if;
  else
    if not (public.has_capability('blog.write.any')
            or (public.has_capability('blog.write') and owner = auth.uid())) then
      raise exception 'blog.write is required to set status %', p_status using errcode = '42501';
    end if;
  end if;

  update public.blog_posts
     set status = p_status,
         published = (p_status = 'published'),
         scheduled_for = case when p_status = 'scheduled' then p_scheduled_for else null end
   where id = p_post_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.blog_set_post_status(uuid, text, timestamptz) from public;
grant execute on function public.blog_set_post_status(uuid, text, timestamptz)
  to authenticated, service_role;

-- ── Taxonomy and history ───────────────────────────────────
drop policy if exists "admin_all_blog_categories" on public.blog_categories;
create policy blog_categories_read on public.blog_categories
for select to anon, authenticated
using (true);

drop policy if exists blog_categories_write on public.blog_categories;
create policy blog_categories_write on public.blog_categories
for all to authenticated
using (public.has_capability('blog.categories.manage'))
with check (public.has_capability('blog.categories.manage'));

drop policy if exists "admin_all_blog_tags" on public.blog_tags;
create policy blog_tags_read on public.blog_tags
for select to anon, authenticated
using (true);

drop policy if exists blog_tags_write on public.blog_tags;
create policy blog_tags_write on public.blog_tags
for all to authenticated
using (public.has_capability('blog.categories.manage'))
with check (public.has_capability('blog.categories.manage'));

-- Revisions and the audit log are written by the AFTER trigger, which runs as
-- the row owner. Clients only ever read them, so there is no insert policy:
-- an audit trail its subjects can write is not an audit trail.
drop policy if exists "admin_all_blog_post_revisions" on public.blog_post_revisions;
create policy blog_post_revisions_read on public.blog_post_revisions
for select to authenticated
using (public.has_capability('blog.read'));

drop policy if exists "admin_all_blog_post_audit_log" on public.blog_post_audit_log;
create policy blog_post_audit_log_read on public.blog_post_audit_log
for select to authenticated
using (public.has_capability('audit.read'));
