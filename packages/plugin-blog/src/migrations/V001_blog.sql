-- ═══════════════════════════════════════════════════════════
--  plugin-blog · V001 — blog_* tables + RLS
--  Owned tables (all prefixed blog_): blog_categories, blog_tags,
--  blog_posts, blog_posts_tags.
--  Self-contained: no FK to team_members (author is a free UUID) and
--  no media_files (that table belongs to the future plugin-media).
--  Depends on core.V001 providing public.is_admin().
-- ═══════════════════════════════════════════════════════════

-- ── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES public.blog_categories(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tags ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Posts (V001 base columns + V002 additions, merged) ──────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  excerpt            TEXT,
  body               TEXT,
  cover_image_url    TEXT,
  author_id          UUID,
  author_name        TEXT,
  category           TEXT,
  category_id        UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags               TEXT[] DEFAULT '{}',
  seo_title          TEXT,
  seo_description    TEXT,
  og_image_url       TEXT,
  featured_image_url TEXT,
  read_time_minutes  INTEGER,
  status             TEXT DEFAULT 'draft',
  published          BOOLEAN DEFAULT false,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Post ↔ Tag junction ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts_tags  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_categories" ON public.blog_categories;
CREATE POLICY "public_read_blog_categories" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_blog_categories" ON public.blog_categories;
CREATE POLICY "admin_all_blog_categories" ON public.blog_categories TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_blog_tags" ON public.blog_tags;
CREATE POLICY "public_read_blog_tags" ON public.blog_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_blog_tags" ON public.blog_tags;
CREATE POLICY "admin_all_blog_tags" ON public.blog_tags TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_blog_posts" ON public.blog_posts;
CREATE POLICY "public_read_blog_posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_blog_posts" ON public.blog_posts;
CREATE POLICY "admin_all_blog_posts" ON public.blog_posts TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_blog_posts_tags" ON public.blog_posts_tags;
CREATE POLICY "public_read_blog_posts_tags" ON public.blog_posts_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_blog_posts_tags" ON public.blog_posts_tags;
CREATE POLICY "admin_all_blog_posts_tags" ON public.blog_posts_tags TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.blog_categories, public.blog_tags, public.blog_posts, public.blog_posts_tags TO anon;
GRANT ALL ON public.blog_categories, public.blog_tags, public.blog_posts, public.blog_posts_tags TO authenticated, service_role;
