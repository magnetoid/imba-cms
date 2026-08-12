import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CMS_CAPABILITIES, hasCapability, useCmsSession } from '@imba/core'
import { blogDb } from '../public/blogClient'
import type { BlogPost } from '../types'
import {
  Button, Badge, Switch,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from './ui'
import { Plus, Pencil, Trash2, Loader2, FileText, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { SEED_POSTS } from '../seed-data'

function statusVariant(status?: string): 'secondary' | 'default' | 'outline' {
  if (status === 'published') return 'default'
  if (status === 'scheduled') return 'outline'
  if (status === 'approved') return 'outline'
  if (status === 'in_review') return 'secondary'
  if (status === 'archived') return 'secondary'
  return 'secondary'
}

export default function BlogAdmin() {
  const navigate = useNavigate()
  const session = useCmsSession()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const [seeding, setSeeding] = useState(false)
  const canWrite = hasCapability(session, CMS_CAPABILITIES.blogWrite)
  const canPublish = hasCapability(session, CMS_CAPABILITIES.blogPublish)
  const canDelete = hasCapability(session, CMS_CAPABILITIES.blogDelete)
  const canSeed = hasCapability(session, CMS_CAPABILITIES.blogSeed)

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
    if (!canDelete) {
      toast.error('You do not have permission to delete blog posts.')
      return
    }
    if (!confirm('Delete this post?')) return
    await blogDb().from('blog_posts').delete().eq('id', id)
    load()
  }

  async function seedFromDefaults() {
    if (!canSeed) {
      toast.error('You do not have permission to seed starter blog content.')
      return
    }
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
    if (!canPublish) {
      toast.error('You do not have permission to publish blog posts.')
      return
    }
    await blogDb().from('blog_posts').update({
      published: !post.published,
      published_at: !post.published ? new Date().toISOString() : null,
      status: !post.published ? 'published' : 'draft',
    }).eq('id', post.id)
    load()
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
            {posts.length > 0 && ` ${posts.length} total · ${posts.filter(p => p.published).length} published · ${posts.filter(p => p.status === 'scheduled').length} scheduled.`}
          </p>
          {(!canWrite || !canPublish || !canDelete || !canSeed) && (
            <p className="text-xs text-muted-foreground mt-2">
              Permissions active:
              {canWrite ? ' write' : ' no-write'}
              {canPublish ? ' publish' : ' no-publish'}
              {canDelete ? ' delete' : ' no-delete'}
              {canSeed ? ' seed' : ' no-seed'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {missingSeeds > 0 && (
            <Button variant="outline" onClick={seedFromDefaults} disabled={seeding || !canSeed}>
              {seeding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Seeding…</> : <><Database className="h-4 w-4 mr-2" />Seed {missingSeeds} sample post{missingSeeds === 1 ? '' : 's'}</>}
            </Button>
          )}
          <Button onClick={() => navigate('/admin/blog/new')} disabled={!canWrite}>
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
            <Button variant="outline" size="sm" onClick={seedFromDefaults} disabled={seeding || !canSeed}>
              {seeding ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Seeding…</> : <><Database className="h-3.5 w-3.5 mr-1" />Seed {SEED_POSTS.length} sample posts</>}
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/blog/new')} disabled={!canWrite}>
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
                className={canWrite ? 'cursor-pointer' : undefined}
                onClick={() => {
                  if (canWrite) navigate(`/admin/blog/edit/${post.id}`)
                }}
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
                  <Switch checked={post.published} onCheckedChange={() => togglePublished(post)} disabled={!canPublish} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono text-xs">
                  {post.status === 'scheduled' && post.scheduled_for
                    ? `Scheduled ${new Date(post.scheduled_for).toLocaleString()}`
                    : post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : post.created_at
                        ? new Date(post.created_at).toLocaleDateString()
                        : '—'}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/blog/edit/${post.id}`)} disabled={!canWrite}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)} disabled={!canDelete}>
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
    </div>
  )
}
