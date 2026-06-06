import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogDb } from './blogClient'
import { blogContent } from './blogContent'
import type { BlogPost } from '../types'

const STATIC_POSTS = [
  {
    id: '1',
    title: 'How to Explode Your Sales Using AI Video: The Ultimate Guide for 2026',
    excerpt: 'AI video outreach gets 2–3× more response rates than plain text. Discover the exact workflow we use to produce AI-powered video campaigns that convert.',
    category: 'AI Video',
    date: 'March 8, 2026',
    read_time: 9,
    featured: true,
    slug: 'ai-video-sales-guide-2026',
  },
  {
    id: '2',
    title: 'How to Generate Sales with Video Products: A Comprehensive Guide',
    excerpt: 'Product videos increase conversions by up to 80%. This guide covers every type of product video — from demos to testimonials — and when to use each.',
    category: 'Video Production',
    date: 'March 30, 2025',
    read_time: 8,
    featured: false,
    slug: 'generate-sales-video-products',
  },
  {
    id: '3',
    title: 'The Impact of AI on Video Production in 2025',
    excerpt: 'From automated editing and AI avatars to generative B-roll — how AI is fundamentally changing what\'s possible in video production, and how to stay ahead.',
    category: 'AI Video',
    date: 'January 13, 2025',
    read_time: 7,
    featured: false,
    slug: 'ai-impact-video-production-2025',
  },
  {
    id: '4',
    title: 'Going Viral: Strategies for eCommerce Brands on TikTok',
    excerpt: 'TikTok drives billions in ecommerce sales. Learn the content formats, posting cadences, and production techniques that actually lead to viral product videos.',
    category: 'TikTok',
    date: 'December 25, 2024',
    read_time: 6,
    featured: false,
    slug: 'tiktok-ecommerce-viral-strategies',
  },
  {
    id: '5',
    title: 'How to Generate Website Traffic with Video SEO in 2025',
    excerpt: 'YouTube is the world\'s second-largest search engine. A practical guide to optimising your video content for discovery, featuring our exact keyword strategy.',
    category: 'Video Production',
    date: 'October 28, 2024',
    read_time: 7,
    featured: false,
    slug: 'video-seo-traffic-2025',
  },
  {
    id: '6',
    title: 'Transforming Views into Sales: The Power of Shoppable Video',
    excerpt: 'Shoppable video bridges the gap between content and commerce. A complete breakdown of the technology, platforms, and creative approach that converts viewers into buyers.',
    category: 'AI Video',
    date: 'September 22, 2024',
    read_time: 5,
    featured: false,
    slug: 'shoppable-video-sales',
  },
  {
    id: '7',
    title: 'TikTok Success: A Step-by-Step Guide to Shooting Engaging Brand Videos',
    excerpt: 'Production tips, creative formats, and the exact shooting checklist we use to produce TikTok content that consistently outperforms clients\' existing organic reach.',
    category: 'TikTok',
    date: 'September 21, 2024',
    read_time: 6,
    featured: false,
    slug: 'tiktok-brand-video-guide',
  },
  {
    id: '8',
    title: 'Why User-Generated Content is Revolutionizing Digital Marketing',
    excerpt: 'UGC converts at 4× the rate of brand-produced content. Here\'s how to brief, direct, and edit UGC-style videos that feel authentic and drive real results.',
    category: 'Video Production',
    date: 'September 20, 2024',
    read_time: 5,
    featured: false,
    slug: 'ugc-digital-marketing',
  },
  {
    id: '9',
    title: 'Unleash Creativity: Master Micro Drama in Video Production',
    excerpt: 'Micro-dramas are exploding on every platform. A deep dive into the format, storytelling structure, and production workflow that makes these short films so addictive.',
    category: 'Film',
    date: 'October 27, 2024',
    read_time: 6,
    featured: false,
    slug: 'micro-drama-video-production',
  },
  {
    id: '10',
    title: 'Exploring the Latest Advances in 4K and 8K Video Technology',
    excerpt: 'How the latest camera technology is changing what\'s possible in commercial production — and how we use it to deliver broadcast-quality footage for brand campaigns.',
    category: 'Technology',
    date: 'February 24, 2025',
    read_time: 6,
    featured: false,
    slug: '4k-8k-video-technology',
  },
  {
    id: '11',
    title: 'The Rise of AI in Video Production: A 2024 Perspective',
    excerpt: 'A comprehensive look at how AI tools — Runway, Sora, Stable Diffusion — are reshaping production pipelines and what it means for brands and agencies.',
    category: 'AI Video',
    date: 'January 13, 2025',
    read_time: 8,
    featured: false,
    slug: 'ai-video-production-2024',
  },
  {
    id: '12',
    title: 'Unleashing Future Visions: Generative AI Video 2025',
    excerpt: 'Generative AI video has crossed the uncanny valley. How we\'re integrating tools like Sora into real client productions — and the results we\'re seeing.',
    category: 'AI Video',
    date: 'October 12, 2024',
    read_time: 7,
    featured: false,
    slug: 'generative-ai-video-2025',
  },
]

const STATIC_CATEGORIES = ['All', 'AI Video', 'Video Production', 'TikTok', 'Film', 'Technology']

const CAT_COLOR: Record<string, string> = {
  'AI Video': '#FAFAFA',
  'Video Production': '#FAFAFA',
  'TikTok': '#3CBFAE',
  'Film': '#8A8AFF',
  'Technology': '#6C7AE0',
}

interface DisplayPost {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  read_time: number
  featured: boolean
  slug: string
  cover_image_url?: string
}

function toDisplayPost(p: BlogPost): DisplayPost {
  const cat = (p.blog_categories?.name) || p.category || 'Uncategorised'
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt || '',
    category: cat,
    date: p.published_at
      ? new Date(p.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    read_time: p.read_time_minutes || 5,
    featured: false,
    slug: p.slug,
    cover_image_url: p.cover_image_url || p.featured_image_url || p.og_image_url,
  }
}

const POSTS_PER_PAGE = 9

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All')
  // null = still loading; [] = loaded with zero posts; [...] = loaded with posts.
  // Using null avoids the "12 static posts flash, then collapse to N real ones"
  // bug that looked like sections appearing then being covered.
  const [livePosts, setLivePosts] = useState<DisplayPost[] | null>(null)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    blogDb().from('blog_posts')
      .select('*, blog_categories(name, slug)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setFetchFailed(true)
          setLivePosts(null)
        } else {
          setLivePosts((data || []).map(toDisplayPost))
        }
      })
  }, [])

  const loading = livePosts === null && !fetchFailed
  // Use static posts only if the network fetch outright failed.
  const POSTS = livePosts ?? (fetchFailed ? (STATIC_POSTS as DisplayPost[]) : [])

  const allCategories = POSTS.length > 0
    ? ['All', ...Array.from(new Set(POSTS.map(p => p.category).filter(Boolean)))]
    : STATIC_CATEGORIES

  const filtered = activeCategory === 'All'
    ? POSTS
    : POSTS.filter(p => p.category === activeCategory)

  const featured = POSTS.find(p => p.featured) || POSTS[0]

  // Grid list (exclude featured when on "All", otherwise show all filtered).
  const gridList = activeCategory === 'All'
    ? POSTS.filter(p => p.id !== featured?.id)
    : filtered

  const totalPages = Math.max(1, Math.ceil(gridList.length / POSTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pagedPosts = gridList.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE)

  // Reset to page 1 whenever the active filter changes or the dataset changes size.
  useEffect(() => { setPage(1) }, [activeCategory, gridList.length])

  const content = blogContent()
  const ctaExternal = /^(mailto:|https?:)/.test(content.ctaHref)

  return (
    <>
      {/* ── PAGE HERO ─────────────────────────────────────── */}
      <section className="pt-36 pb-16 px-6 lg:px-12 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />
        <div className="absolute top-0 right-0 w-[40vw] h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 100% 30%, rgba(255,255,255,0.05) 0%, transparent 65%)' }}
        />
        <div className="relative max-w-screen-xl mx-auto">
          <p className="eyebrow mb-5 reveal">{content.heroEyebrow}</p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1 className="font-display font-bold leading-none reveal reveal-delay-1"
              style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}>
              {content.heroTitle}<br />
              <em className="italic">{content.heroTitleEm}</em>
            </h1>
            <p className="text-smoke-dim max-w-xs leading-relaxed reveal reveal-delay-2" style={{ fontSize: '0.93rem' }}>
              {content.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURED POST ─────────────────────────────────── */}
      {!loading && activeCategory === 'All' && featured && (
        <section className="bg-ink px-6 lg:px-12 pb-8">
          <div className="max-w-screen-xl mx-auto">
            <Link
              to={`/blog/${featured.slug}`}
              className="grid lg:grid-cols-2 gap-0 border border-white/8 group cursor-pointer hover:border-white/15 transition-colors"
            >
              {/* Visual */}
              <div className="relative overflow-hidden bg-ink-3 aspect-video lg:aspect-auto min-h-[260px]">
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="font-display font-bold text-smoke/20 select-none" style={{ fontSize: 'clamp(5rem, 12vw, 10rem)' }}>
                        {featured.category === 'AI Video' ? '◈' : '▶'}
                      </div>
                    </div>
                  </>
                )}
                <div className="absolute top-4 left-4 font-mono-custom text-[0.58rem] tracking-widest uppercase px-2 py-1 z-10"
                  style={{ background: `${CAT_COLOR[featured.category] || '#FAFAFA'}22`, color: CAT_COLOR[featured.category] || '#FAFAFA', border: `1px solid ${CAT_COLOR[featured.category] || '#FAFAFA'}33` }}>
                  Featured · {featured.category}
                </div>
              </div>

              {/* Content */}
              <div className="bg-ink-2 p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="font-mono-custom text-[0.6rem] tracking-widest text-smoke-faint uppercase">{featured.date}</span>
                    <span className="font-mono-custom text-[0.58rem] text-smoke-faint/50">{featured.read_time} min read</span>
                  </div>
                  <h2 className="font-display font-bold text-smoke leading-tight mb-5"
                    style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)' }}>
                    {featured.title}
                  </h2>
                  <p className="text-smoke-dim leading-relaxed" style={{ fontSize: '0.93rem' }}>
                    {featured.excerpt}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <span className="font-mono-custom text-[0.68rem] tracking-[0.14em] uppercase text-ember flex items-center gap-2 group-hover:gap-3 transition-all">
                    <span>Read article</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── CATEGORY FILTER ───────────────────────────────── */}
      <div className="bg-ink border-b border-white/5 px-6 lg:px-12 py-5">
        <div className="max-w-screen-xl mx-auto flex gap-1.5 overflow-x-auto">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 font-mono-custom text-[0.65rem] tracking-[0.12em] uppercase px-4 py-2 transition-all duration-200"
              style={{
                background: activeCategory === cat ? '#FAFAFA' : 'transparent',
                color: activeCategory === cat ? '#F5F4F0' : '#6B6A65',
                border: `1px solid ${activeCategory === cat ? '#FAFAFA' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── POSTS GRID ────────────────────────────────────── */}
      <section className="bg-ink py-12 px-6 lg:px-12">
        {loading ? (
          // Skeleton grid — keeps layout stable until Supabase resolves.
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-ink-2 border border-white/5 flex flex-col animate-pulse">
                <div className="aspect-video bg-ink-3" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-5 bg-white/5 rounded w-5/6" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : pagedPosts.length === 0 ? (
          <div className="max-w-screen-xl mx-auto text-center py-24 text-smoke-faint">
            <p className="font-display font-bold text-2xl text-smoke mb-2">
              {gridList.length === 0 && POSTS.length === 0
                ? 'No posts published yet.'
                : 'No posts in this category.'}
            </p>
            <p className="text-sm text-smoke-dim">
              {gridList.length === 0 && POSTS.length === 0
                ? 'Check back soon — new articles ship every month.'
                : 'Try a different category or browse all posts.'}
            </p>
            {activeCategory !== 'All' && (
              <button
                onClick={() => setActiveCategory('All')}
                className="mt-6 font-mono-custom text-[0.65rem] tracking-[0.14em] uppercase text-ember hover:text-paper transition-colors"
              >
                Show all posts →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-ink-2 border border-white/5 hover:border-white/12 transition-all duration-300 flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden aspect-video bg-ink-3 flex-shrink-0">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        onError={e => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                          const fb = el.nextElementSibling as HTMLElement
                          if (fb) fb.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    {/* Placeholder shown when no image OR when the image fails to load */}
                    <div
                      className={`${post.cover_image_url ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
                      style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, ${CAT_COLOR[post.category] || '#FAFAFA'}12 0%, transparent 70%)` }}
                    >
                      <span className="font-display font-bold select-none" style={{ fontSize: '4rem', color: `${CAT_COLOR[post.category] || '#FAFAFA'}28` }}>
                        {post.category === 'AI Video' ? '◈' : post.category === 'TikTok' ? '◉' : post.category === 'Film' ? '◬' : post.category === 'Technology' ? '◰' : '▶'}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 font-mono-custom text-[0.55rem] tracking-widest uppercase px-2 py-1 z-10"
                      style={{ background: `${CAT_COLOR[post.category] || '#FAFAFA'}22`, color: CAT_COLOR[post.category] || '#FAFAFA', border: `1px solid ${CAT_COLOR[post.category] || '#FAFAFA'}33` }}>
                      {post.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono-custom text-[0.58rem] tracking-widest text-smoke-faint uppercase">{post.date}</span>
                      <span className="font-mono-custom text-[0.55rem] text-smoke-faint/40">{post.read_time} min</span>
                    </div>
                    <h3 className="font-display font-bold text-smoke leading-tight mb-3 group-hover:text-ember transition-colors flex-1"
                      style={{ fontSize: '1.15rem' }}>
                      {post.title}
                    </h3>
                    <p className="text-smoke-dim leading-relaxed mb-5 line-clamp-3" style={{ fontSize: '0.82rem' }}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-auto font-mono-custom text-[0.62rem] tracking-[0.14em] uppercase text-ember group-hover:gap-3 transition-all">
                      <span>Read more</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onChange={p => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                total={gridList.length}
              />
            )}
          </>
        )}
      </section>

      {/* ── TOPICS STRIP ─────────────────────────────────── */}
      <section className="bg-ink-2 py-16 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-screen-xl mx-auto">
          <p className="font-mono-custom text-[0.62rem] tracking-[0.2em] uppercase text-smoke-faint/50 mb-8 text-center">{content.pillarsLabel}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {content.pillars.map(topic => (
              <span key={topic}
                className="font-mono-custom text-[0.62rem] tracking-[0.12em] uppercase px-3 py-2 border border-white/8 text-smoke-faint/50 hover:text-smoke-faint hover:border-white/15 transition-colors cursor-default">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ground border-t border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 8px)',
        }} />
        <div className="relative px-6 lg:px-12 py-20 max-w-screen-xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <h2 className="display-md text-paper" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)' }}>
              {content.ctaTitle}
            </h2>
            <p className="text-paper-dim mt-3 max-w-md" style={{ fontSize: '0.98rem' }}>
              {content.ctaSubtitle}
            </p>
          </div>
          {ctaExternal ? (
            <a href={content.ctaHref} className="pill-button pill-button--primary">
              <span>{content.ctaButtonLabel}</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-current/20">→</span>
            </a>
          ) : (
            <Link to={content.ctaHref} className="pill-button pill-button--primary">
              <span>{content.ctaButtonLabel}</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-current/20">→</span>
            </Link>
          )}
        </div>
      </section>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Pagination control. Shows up to 7 numbered page buttons with ellipses
// for longer ranges, plus Prev / Next.

function Pagination({
  page,
  totalPages,
  onChange,
  total,
}: {
  page: number
  totalPages: number
  onChange: (next: number) => void
  total: number
}) {
  const numbers = buildPageList(page, totalPages)
  return (
    <div className="max-w-screen-xl mx-auto mt-12 flex flex-col items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="font-mono-custom text-[0.62rem] tracking-[0.14em] uppercase px-3 py-2 border border-white/8 text-smoke-dim hover:text-smoke hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="font-mono-custom text-[0.62rem] text-smoke-faint/40 px-2">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`font-mono-custom text-[0.62rem] tracking-[0.14em] uppercase w-9 h-9 border transition-colors ${
                n === page
                  ? 'bg-paper text-ground border-paper'
                  : 'border-white/8 text-smoke-dim hover:text-smoke hover:border-white/20'
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="font-mono-custom text-[0.62rem] tracking-[0.14em] uppercase px-3 py-2 border border-white/8 text-smoke-dim hover:text-smoke hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
      <p className="font-mono-custom text-[0.58rem] tracking-widest uppercase text-smoke-faint/50">
        Page {page} of {totalPages} · {total} {total === 1 ? 'post' : 'posts'}
      </p>
    </div>
  )
}

// Generate the displayed page numbers around the current page.
// Output examples (with current marked):
//   total=4,  page=2  -> [1, 2, 3, 4]
//   total=10, page=1  -> [1, 2, 3, '…', 10]
//   total=10, page=5  -> [1, '…', 4, 5, 6, '…', 10]
//   total=10, page=10 -> [1, '…', 8, 9, 10]
function buildPageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end   = Math.min(total - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}
