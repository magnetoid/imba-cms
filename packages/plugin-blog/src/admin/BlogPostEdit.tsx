import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { blogDb } from '../public/blogClient'
import type { BlogCategory } from '../types'
import {
  Button, Input, Label, Textarea, Switch, Separator,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui'
import {
  Loader2, ArrowLeft, X, Save, Sparkles, Eye, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import TiptapEditor from './TiptapEditor'

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  cover_image_url: '',
  featured_image_url: '',
  category: '',
  category_id: '',
  tags: [] as string[],
  read_time_minutes: 5,
  published: false,
  status: 'draft' as 'draft' | 'published' | 'scheduled',
  author_name: '',
  seo_title: '',
  seo_description: '',
  og_image_url: '',
}

type FormState = typeof EMPTY_FORM

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function plainTextFromHtml(html: string): string {
  if (!html) return ''
  // Strip tags, decode common entities. Good enough for word-count + outline.
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pull the H2/H3/H4 elements out of the editor's HTML to render a live
// outline. Skipping levels is flagged so admins can fix structure for SEO.
interface OutlineNode { level: 2 | 3 | 4; text: string }
function extractOutline(html: string): OutlineNode[] {
  if (!html) return []
  const out: OutlineNode[] = []
  const re = /<h([234])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const level = parseInt(m[1], 10) as 2 | 3 | 4
    const text = plainTextFromHtml(m[2])
    if (text) out.push({ level, text })
  }
  return out
}

function levelSkipWarning(outline: OutlineNode[]): string | null {
  // Catch H2 -> H4 (skipping H3), or H3 immediately as first heading, etc.
  for (let i = 0; i < outline.length; i++) {
    const cur = outline[i]
    const prev = i === 0 ? null : outline[i - 1]
    if (!prev && cur.level > 2) {
      return `First heading is H${cur.level}. Start with H2 (post title is already H1).`
    }
    if (prev && cur.level > prev.level + 1) {
      return `H${prev.level} → H${cur.level} skips a level. Use H${prev.level + 1} or rephrase.`
    }
  }
  return null
}

export default function BlogPostEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [originalTitle, setOriginalTitle] = useState('')
  const [showOutline, setShowOutline] = useState(true)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const prefillApplied = useRef(false)

  // Track unsaved changes — warn before navigating away
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    blogDb().from('blog_categories').select('*').order('name')
      .then(({ data }) => setCategories(data || []))

    if (!isEdit) {
      const prefill = (location.state as { prefill?: Partial<FormState> } | null)?.prefill
      if (prefill && !prefillApplied.current) {
        prefillApplied.current = true
        setForm(f => ({ ...f, ...prefill }))
        window.history.replaceState({}, '')
      }
      return
    }

    setLoading(true)
    blogDb().from('blog_posts').select('*').eq('id', id!).single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(err?.message || 'Post not found')
          setLoading(false)
          return
        }
        setOriginalTitle(data.title)
        setForm({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || '',
          body: data.body || '',
          cover_image_url: data.cover_image_url || '',
          featured_image_url: data.featured_image_url || '',
          category: data.category || '',
          category_id: data.category_id || '',
          tags: data.tags ? [...data.tags] : [],
          read_time_minutes: data.read_time_minutes ?? 5,
          published: data.published,
          status: data.status || 'draft',
          author_name: data.author_name || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          og_image_url: data.og_image_url || '',
        })
        setLoading(false)
      })
  }, [id, isEdit, location.state])

  // Warn on unload if dirty
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setDirty(true)
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      update('tags', [...form.tags, t])
    }
    setTagInput('')
    tagInputRef.current?.focus()
  }

  function removeTag(tag: string) {
    update('tags', form.tags.filter(t => t !== tag))
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      title: form.title,
      slug: form.slug || toSlug(form.title),
      excerpt: form.excerpt,
      body: form.body,
      cover_image_url: form.cover_image_url,
      featured_image_url: form.featured_image_url,
      category: form.category,
      category_id: form.category_id || null,
      tags: form.tags,
      read_time_minutes: form.read_time_minutes,
      published: form.published,
      status: form.status,
      author_name: form.author_name,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      og_image_url: form.og_image_url,
      published_at: form.published ? new Date().toISOString() : null,
    }
    if (isEdit) {
      const { error: err } = await blogDb().from('blog_posts').update(payload).eq('id', id!)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await blogDb().from('blog_posts').insert([payload])
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setDirty(false)
    navigate('/admin/blog')
  }

  function cancel() {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return
    navigate('/admin/blog')
  }

  // Outline / word count derived from current body
  const outline = useMemo(() => extractOutline(form.body), [form.body])
  const outlineWarning = useMemo(() => levelSkipWarning(outline), [outline])
  const wordCount = useMemo(() => {
    const txt = plainTextFromHtml(form.body)
    if (!txt) return 0
    return txt.split(/\s+/).filter(Boolean).length
  }, [form.body])
  const estReadMin = Math.max(1, Math.round(wordCount / 200))

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── STICKY HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm text-foreground truncate font-medium">
              {isEdit ? (originalTitle || form.title || 'Untitled') : 'New post'}
            </span>
            {dirty && (
              <span className="hidden md:inline-block ml-3 text-[0.6rem] font-mono tracking-widest uppercase text-amber-500/80">
                Unsaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-muted-foreground/60 font-mono">
              {wordCount} words · ~{estReadMin} min
            </span>
            <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save</>}
            </Button>
          </div>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-0">

        {/* ── MAIN COLUMN — title + editor (edge-to-edge) ────────── */}
        <main className="px-6 lg:px-10 pt-8 pb-24 min-w-0">
          <div className="max-w-[1100px] mx-auto">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-2">
              {isEdit ? 'Edit post' : 'New post'}
            </p>

            {/* Title — large editorial input, this becomes the public H1 */}
            <input
              value={form.title}
              onChange={e => {
                const v = e.target.value
                setForm(prev => ({
                  ...prev,
                  title: v,
                  slug: prev.slug || toSlug(v),
                }))
                setDirty(true)
              }}
              placeholder="Post title (this becomes the page H1)…"
              className="w-full bg-transparent border-0 outline-none focus:ring-0
                font-display font-medium text-foreground placeholder:text-muted-foreground/30
                text-4xl md:text-5xl leading-[1.1] tracking-tight
                mb-4"
            />

            {/* Slug + Excerpt — quiet inline meta */}
            <div className="flex flex-col gap-3 mb-6 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest min-w-[44px]">
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={e => update('slug', toSlug(e.target.value))}
                  placeholder="auto-from-title"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-muted-foreground font-mono py-1 focus:text-foreground"
                />
              </div>
              <Textarea
                value={form.excerpt}
                onChange={e => update('excerpt', e.target.value)}
                rows={2}
                placeholder="Short excerpt shown in listings and as the meta description…"
                className="resize-none border-dashed bg-transparent text-base"
              />
            </div>

            {/* Tiptap — full variant, large prose */}
            <TiptapEditor
              value={form.body}
              onChange={html => update('body', html)}
              placeholder="Write the article body. Use H2 for sections, H3 for sub-sections, H4 for deep details."
              variant="full"
            />
          </div>
        </main>

        {/* ── SIDEBAR — Publish / SEO / Taxonomy / Imagery ──────── */}
        <aside className="border-t xl:border-t-0 xl:border-l border-border bg-card/30 px-6 lg:px-8 py-6 xl:overflow-y-auto xl:max-h-[calc(100vh-58px)] xl:sticky xl:top-[58px]">
          <div className="flex flex-col gap-6">

            {/* Publish */}
            <Section title="Publish">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={val => update('status', val as FormState['status'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="b-published"
                  checked={form.published}
                  onCheckedChange={c => setForm(prev => {
                    setDirty(true)
                    return { ...prev, published: c, status: c ? 'published' : 'draft' }
                  })}
                />
                <Label htmlFor="b-published">Published</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-author">Author</Label>
                  <Input
                    id="b-author"
                    value={form.author_name}
                    onChange={e => update('author_name', e.target.value)}
                    placeholder="Imba Team"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-readtime">Read time</Label>
                  <Input
                    id="b-readtime"
                    type="number"
                    min={1}
                    value={form.read_time_minutes}
                    onChange={e => update('read_time_minutes', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
              <p className="text-[0.65rem] font-mono text-muted-foreground/50 uppercase tracking-widest">
                {wordCount} words · ~{estReadMin} min read (auto)
              </p>
            </Section>

            {/* SEO outline — live H2/H3/H4 list */}
            <Section
              title="Heading outline"
              right={
                <button
                  type="button"
                  onClick={() => setShowOutline(!showOutline)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showOutline ? 'Collapse' : 'Expand'}
                >
                  {showOutline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              }
            >
              {showOutline && (
                <>
                  {outlineWarning && (
                    <div className="flex items-start gap-2 text-xs text-amber-500 border border-amber-500/20 bg-amber-500/5 rounded-md p-2">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>{outlineWarning}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[0.6rem] tracking-widest uppercase text-muted-foreground/50 w-6">H1</span>
                    <span className="truncate font-medium text-foreground">
                      {form.title || <span className="italic text-muted-foreground/50">(post title)</span>}
                    </span>
                  </div>
                  {outline.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic">
                      No body headings yet. Use H2 for main sections.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {outline.map((node, i) => (
                        <li key={i} className="flex items-baseline gap-2 text-xs">
                          <span className="font-mono text-[0.6rem] tracking-widest uppercase text-muted-foreground/50 w-6">
                            H{node.level}
                          </span>
                          <span
                            className="text-foreground/80 truncate"
                            style={{ paddingLeft: `${(node.level - 2) * 12}px` }}
                          >
                            {node.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[0.65rem] text-muted-foreground/50 leading-snug">
                    SEO best practice: one H1 (title), H2 for sections, H3 inside H2, H4 inside H3. Don't skip levels.
                  </p>
                </>
              )}
            </Section>

            {/* Taxonomy */}
            <Section title="Taxonomy">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category_id || '__none__'}
                  onValueChange={val => {
                    if (val === '__none__') {
                      update('category_id', '')
                      update('category', '')
                    } else {
                      const cat = categories.find(c => c.id === val)
                      setForm(prev => {
                        setDirty(true)
                        return { ...prev, category_id: val, category: cat?.name || '' }
                      })
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5 min-h-[2rem] p-2 border border-input rounded-md bg-background">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag() }
                      if (e.key === ',' ) { e.preventDefault(); addTag() }
                    }}
                    placeholder={form.tags.length === 0 ? 'Type tag + Enter' : 'Add more…'}
                    className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
                  />
                </div>
              </div>
            </Section>

            {/* Imagery */}
            <Section title="Imagery">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-cover">Cover image URL</Label>
                <Input
                  id="b-cover"
                  value={form.cover_image_url}
                  onChange={e => update('cover_image_url', e.target.value.trim())}
                  placeholder="https://…"
                />
                {form.cover_image_url && (
                  <img
                    src={form.cover_image_url}
                    alt="cover preview"
                    className="mt-2 rounded-md border border-border w-full aspect-video object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-featured-img">Featured image URL</Label>
                <Input
                  id="b-featured-img"
                  value={form.featured_image_url}
                  onChange={e => update('featured_image_url', e.target.value.trim())}
                  placeholder="https://…"
                />
              </div>
            </Section>

            {/* SEO */}
            <Section title="SEO">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-seo-title">
                  SEO title{' '}
                  <span className="text-[0.6rem] font-mono text-muted-foreground/50 ml-1">
                    {form.seo_title.length}/60
                  </span>
                </Label>
                <Input
                  id="b-seo-title"
                  value={form.seo_title}
                  onChange={e => update('seo_title', e.target.value)}
                  placeholder="Override the H1 for search engines"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-seo-desc">
                  Meta description{' '}
                  <span className="text-[0.6rem] font-mono text-muted-foreground/50 ml-1">
                    {form.seo_description.length}/160
                  </span>
                </Label>
                <Textarea
                  id="b-seo-desc"
                  rows={3}
                  value={form.seo_description}
                  onChange={e => update('seo_description', e.target.value)}
                  placeholder="120–160 characters that appear in Google results."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-og-img">OG image URL</Label>
                <Input
                  id="b-og-img"
                  value={form.og_image_url}
                  onChange={e => update('og_image_url', e.target.value.trim())}
                  placeholder="Image used when shared on social — 1200×630"
                />
              </div>
            </Section>

            {/* AI prefill notice */}
            {Boolean((location.state as { prefill?: unknown } | null)?.prefill) && !isEdit && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md p-3">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>Prefilled by AI generator. Review and save when ready.</span>
              </div>
            )}

            {/* Preview link */}
            {isEdit && form.slug && form.published && (
              <a
                href={`/blog/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                View on site
              </a>
            )}

            <Separator />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button onClick={() => handleSave()} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save post</>}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

// Compact section wrapper used by every sidebar group.
function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.6rem] font-mono tracking-widest uppercase text-muted-foreground">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  )
}
