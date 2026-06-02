import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { blogDb } from '../public/blogClient'
import type { BlogPost } from '../types'
import {
  Button, Input, Label, Textarea, Badge, Switch,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui'
import { Plus, Pencil, Trash2, Loader2, FileText, Sparkles, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { SEED_POSTS } from '../seed-data'

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function statusVariant(status?: string): 'secondary' | 'default' | 'outline' {
  if (status === 'published') return 'default'
  if (status === 'scheduled') return 'outline'
  return 'secondary'
}

export default function BlogAdmin() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  // AI Generator state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiKey, setAiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [seeding, setSeeding] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await blogDb()
      .from('blog_posts')
      .select('*, blog_categories(name, slug)')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    await blogDb().from('blog_posts').delete().eq('id', id)
    load()
  }

  async function seedFromDefaults() {
    if (posts.length > 0) {
      if (!confirm(`Blog already has ${posts.length} post${posts.length === 1 ? '' : 's'}. Seeding only inserts the default posts whose slugs aren't already in the database. Continue?`)) return
    }
    setSeeding(true)
    const existingSlugs = new Set(posts.map(p => p.slug))
    const now = new Date().toISOString()
    const rows = SEED_POSTS
      .filter(s => !existingSlugs.has(s.slug))
      .map(s => ({
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt,
        body: s.body,
        category: s.category,
        tags: s.tags,
        read_time_minutes: s.read_time_minutes,
        published: true,
        status: 'published',
        published_at: s.published_at,
        author_name: 'Imba Production',
        seo_title: s.title,
        seo_description: s.excerpt.slice(0, 158),
        created_at: now,
      }))
    if (rows.length === 0) {
      setSeeding(false)
      toast('All starter posts already exist.', { icon: 'ℹ️' })
      return
    }
    const { error } = await blogDb().from('blog_posts').insert(rows)
    setSeeding(false)
    if (error) {
      toast.error(`Seed failed: ${error.message}`)
    } else {
      toast.success(`Seeded ${rows.length} post${rows.length === 1 ? '' : 's'} — edit each to flesh out the body.`)
      load()
    }
  }

  async function togglePublished(post: BlogPost) {
    await blogDb().from('blog_posts').update({
      published: !post.published,
      published_at: !post.published ? new Date().toISOString() : null,
      status: !post.published ? 'published' : 'draft',
    }).eq('id', post.id)
    load()
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) { setAiError('Please enter a topic/brief.'); return }
    if (!aiKey.trim()) { setAiError('Please enter your Anthropic API key.'); return }
    localStorage.setItem('anthropic_api_key', aiKey)
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': aiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: `Generate a comprehensive blog post for a video production company (Imba Production) about: ${aiPrompt}. Return ONLY valid JSON (no markdown code blocks) with: title, slug, excerpt (2 sentences), body (markdown, 800+ words), category (one of: AI Video, Video Production, Brand Film, Social Media, Post Production, eCommerce), tags (array of strings), read_time_minutes, seo_title, seo_description`,
          }],
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`)
      }
      const data = await res.json() as { content: Array<{ text: string }> }
      const text = data.content[0]?.text || ''
      let parsed: {
        title?: string
        slug?: string
        excerpt?: string
        body?: string
        category?: string
        tags?: string[]
        read_time_minutes?: number
        seo_title?: string
        seo_description?: string
      }
      try {
        const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        throw new Error('Could not parse AI response as JSON. Try again.')
      }
      const prefill = {
        title: parsed.title || '',
        slug: parsed.slug || toSlug(parsed.title || ''),
        excerpt: parsed.excerpt || '',
        body: parsed.body || '',
        category: parsed.category || '',
        tags: parsed.tags || [],
        read_time_minutes: parsed.read_time_minutes || 5,
        seo_title: parsed.seo_title || '',
        seo_description: parsed.seo_description || '',
      }
      setAiOpen(false)
      navigate('/admin/blog/new', { state: { prefill } })
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const existingSlugs = new Set(posts.map(p => p.slug))
  const missingSeeds = SEED_POSTS.filter(s => !existingSlugs.has(s.slug)).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage articles and insights.
            {posts.length > 0 && ` ${posts.length} total · ${posts.filter(p => p.published).length} published.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {missingSeeds > 0 && (
            <Button variant="outline" onClick={seedFromDefaults} disabled={seeding}>
              {seeding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Seeding…</> : <><Database className="h-4 w-4 mr-2" />Seed {missingSeeds} sample post{missingSeeds === 1 ? '' : 's'}</>}
            </Button>
          )}
          <Button variant="outline" onClick={() => { setAiOpen(true); setAiError(''); setAiPrompt('') }}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
          <Button onClick={() => navigate('/admin/blog/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New post
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-border rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-1">No posts in the database yet</p>
          <p className="text-muted-foreground/60 text-xs mb-5">
            The public /blog page currently shows the "No posts published yet" empty state.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={seedFromDefaults} disabled={seeding}>
              {seeding ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Seeding…</> : <><Database className="h-3.5 w-3.5 mr-1" />Seed {SEED_POSTS.length} sample posts</>}
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/blog/new')}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Write a new post
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Read time</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map(post => (
              <TableRow
                key={post.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
              >
                <TableCell>
                  <div className="font-medium text-foreground">{post.title}</div>
                  <div className="text-xs text-muted-foreground font-mono">{post.slug}</div>
                </TableCell>
                <TableCell>
                  {post.blog_categories ? (
                    <Badge variant="secondary" className="text-xs">{post.blog_categories.name}</Badge>
                  ) : post.category ? (
                    <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(post.status)} className="text-xs capitalize">
                    {post.status || 'draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {post.read_time_minutes ? `${post.read_time_minutes} min` : '—'}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={post.published} onCheckedChange={() => togglePublished(post)} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono text-xs">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* AI Generator Dialog — generates content, then navigates to the new-post page */}
      <Dialog open={aiOpen} onOpenChange={open => { setAiOpen(open); if (!open) setAiError('') }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate post with AI
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-prompt">Post topic / brief</Label>
              <Textarea
                id="ai-prompt"
                rows={3}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. How AI video is revolutionising ecommerce product pages in 2026"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-key">Anthropic API key</Label>
              <Input
                id="ai-key"
                type="password"
                value={aiKey}
                onChange={e => setAiKey(e.target.value)}
                placeholder="sk-ant-…"
              />
              <p className="text-xs text-muted-foreground">Stored locally in your browser. Never sent to our servers.</p>
            </div>
            {aiError && <p className="text-destructive text-sm">{aiError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAiOpen(false)}>Cancel</Button>
            <Button onClick={handleAiGenerate} disabled={aiLoading}>
              {aiLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
