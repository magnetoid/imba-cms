-- ═══════════════════════════════════════════════════════════
--  plugin-blog · V002 — workflow hardening, audit trail,
--  revisions, and safer public-read policies
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

UPDATE public.blog_posts
SET status = CASE
  WHEN published = true THEN 'published'
  ELSE COALESCE(status, 'draft')
END
WHERE status IS NULL
   OR status NOT IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'archived');

UPDATE public.blog_posts
SET first_published_at = COALESCE(first_published_at, published_at)
WHERE published_at IS NOT NULL;

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS blog_posts_public_listing_idx
  ON public.blog_posts (status, published, published_at DESC);

CREATE INDEX IF NOT EXISTS blog_posts_scheduled_idx
  ON public.blog_posts (status, scheduled_for)
  WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS public.blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  actor_id UUID,
  snapshot JSONB NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_post_revisions_post_id_created_at_idx
  ON public.blog_post_revisions (post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.blog_post_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  event_type TEXT NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_post_audit_log_post_id_created_at_idx
  ON public.blog_post_audit_log (post_id, created_at DESC);

ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_blog_post_revisions" ON public.blog_post_revisions;
CREATE POLICY "admin_all_blog_post_revisions"
ON public.blog_post_revisions
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_blog_post_audit_log" ON public.blog_post_audit_log;
CREATE POLICY "admin_all_blog_post_audit_log"
ON public.blog_post_audit_log
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.normalize_blog_post_workflow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
  next_status TEXT := COALESCE(NEW.status, 'draft');
BEGIN
  NEW.updated_at := now_ts;

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

CREATE OR REPLACE FUNCTION public.audit_blog_post_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor UUID := auth.uid();
  actor_email TEXT := auth.jwt() ->> 'email';
  snapshot JSONB;
  post_id_value UUID;
  status_value TEXT;
  event_name TEXT;
  metadata_value JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    snapshot := to_jsonb(OLD);
    post_id_value := OLD.id;
    status_value := OLD.status;
    event_name := 'deleted';
    metadata_value := jsonb_build_object('published', OLD.published);
  ELSE
    snapshot := to_jsonb(NEW);
    post_id_value := NEW.id;
    status_value := NEW.status;
    event_name := CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      ELSE 'updated'
    END;
    metadata_value := CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object(
        'published', NEW.published,
        'scheduled_for', NEW.scheduled_for
      )
      ELSE jsonb_build_object(
        'published', NEW.published,
        'scheduled_for', NEW.scheduled_for,
        'previous_status', OLD.status,
        'next_status', NEW.status
      )
    END;
  END IF;

  INSERT INTO public.blog_post_revisions (post_id, operation, actor_id, snapshot, status)
  VALUES (post_id_value, LOWER(TG_OP), actor, snapshot, status_value);

  INSERT INTO public.blog_post_audit_log (post_id, event_type, actor_id, actor_email, status, metadata)
  VALUES (post_id_value, event_name, actor, actor_email, status_value, metadata_value);

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_normalize_workflow_before_write ON public.blog_posts;
CREATE TRIGGER blog_posts_normalize_workflow_before_write
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.normalize_blog_post_workflow();

DROP TRIGGER IF EXISTS blog_posts_audit_after_write ON public.blog_posts;
CREATE TRIGGER blog_posts_audit_after_write
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.audit_blog_post_write();

DROP POLICY IF EXISTS "public_read_blog_posts" ON public.blog_posts;
CREATE POLICY "public_read_blog_posts"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (
  published = true
  AND status = 'published'
  AND (published_at IS NULL OR published_at <= NOW())
);

DROP POLICY IF EXISTS "public_read_blog_posts_tags" ON public.blog_posts_tags;
CREATE POLICY "public_read_blog_posts_tags"
ON public.blog_posts_tags
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.blog_posts
    WHERE public.blog_posts.id = public.blog_posts_tags.post_id
      AND public.blog_posts.published = true
      AND public.blog_posts.status = 'published'
      AND (public.blog_posts.published_at IS NULL OR public.blog_posts.published_at <= NOW())
  )
);
