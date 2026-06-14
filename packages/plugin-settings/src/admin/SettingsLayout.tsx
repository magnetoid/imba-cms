import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@imba/ui'

const items = [
  { label: 'Overview', path: '/admin/settings' },
  { label: 'GraphQL', path: '/admin/settings/graphql' },
  { label: 'MCP Server', path: '/admin/settings/mcp' },
] as const

export function SettingsLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const location = useLocation()

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Settings</h2>
        <nav aria-label="Settings sections" className="mt-4 flex flex-col gap-2">
          {items.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className="min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </div>
  )
}
