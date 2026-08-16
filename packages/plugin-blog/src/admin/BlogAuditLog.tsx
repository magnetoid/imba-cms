import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { blogDb } from '../public/blogClient'
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui'

export interface AuditRow {
  id: string
  post_id: string | null
  event_type: string
  actor_email: string | null
  status: string | null
  metadata: Record<string, unknown>
  created_at: string
  blog_posts?: { title: string; slug: string } | null
}

const PAGE_SIZE = 50

function describeEvent(row: AuditRow): string {
  const meta = row.metadata ?? {}
  if (typeof meta.previous_status === 'string' && typeof meta.next_status === 'string' && meta.previous_status !== meta.next_status) {
    return `${meta.previous_status} → ${meta.next_status}`
  }
  return row.status ?? ''
}

/**
 * `/admin/blog/audit` — every audit event across all posts, newest first.
 *
 * The triggers in blog V003 have written `blog_post_audit_log` since they were
 * added and `audit.read` gates it, but the only reader was the per-post panel
 * in the editor. This is the cross-post view a reviewer or content admin
 * actually needs.
 */
export default function BlogAuditLog() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    blogDb()
      .from('blog_post_audit_log')
      .select('id, post_id, event_type, actor_email, status, metadata, created_at, blog_posts(title, slug)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) {
          setError(queryError.message)
          setRows([])
          return
        }
        const list = (data ?? []) as unknown as AuditRow[]
        setHasMore(list.length > PAGE_SIZE)
        setRows(list.slice(0, PAGE_SIZE))
        setError(null)
      })
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="p-8" data-testid="blog-audit-log">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Blog activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every create, update, status change and delete, across all posts.</p>
        </div>
        <Link to="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">← Back to posts</Link>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}

      {rows === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} data-testid={`audit-row-${row.id}`}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {row.post_id && row.blog_posts ? (
                      <Link to={`/admin/blog/edit/${row.post_id}`} className="hover:underline">{row.blog_posts.title}</Link>
                    ) : (
                      <span className="text-muted-foreground">{row.blog_posts?.title ?? (row.post_id ? 'Deleted post' : '—')}</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{row.event_type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{describeEvent(row)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.actor_email ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Older</Button>
      </div>
    </div>
  )
}
