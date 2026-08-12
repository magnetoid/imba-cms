-- ═══════════════════════════════════════════════════════════
--  plugin-media · V001 — managed media asset registry
--  Owned table: media_files
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  alt_text TEXT,
  url TEXT NOT NULL,
  storage_bucket TEXT,
  storage_path TEXT,
  source_type TEXT NOT NULL DEFAULT 'external' CHECK (source_type IN ('upload', 'external')),
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_files_created_at_idx
  ON public.media_files (created_at DESC);

CREATE INDEX IF NOT EXISTS media_files_source_type_idx
  ON public.media_files (source_type);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_media_files_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS media_files_touch_updated_at ON public.media_files;
CREATE TRIGGER media_files_touch_updated_at
BEFORE UPDATE ON public.media_files
FOR EACH ROW
EXECUTE FUNCTION public.touch_media_files_updated_at();

DROP POLICY IF EXISTS "media_files_read" ON public.media_files;
CREATE POLICY "media_files_read"
ON public.media_files
FOR SELECT
TO authenticated
USING (public.has_role(ARRAY['super_admin', 'content_admin', 'editor', 'author', 'reviewer', 'media_manager']));

DROP POLICY IF EXISTS "media_files_write" ON public.media_files;
CREATE POLICY "media_files_write"
ON public.media_files
FOR ALL
TO authenticated
USING (public.has_role(ARRAY['super_admin', 'content_admin', 'editor', 'media_manager']))
WITH CHECK (public.has_role(ARRAY['super_admin', 'content_admin', 'editor', 'media_manager']));

GRANT SELECT ON public.media_files TO authenticated;
GRANT ALL ON public.media_files TO service_role;
