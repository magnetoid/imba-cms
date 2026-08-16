import { Suspense, useEffect, useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import type { AuthApi, CmsSession, NavItem, RouteDef, WidgetDef } from './types'
import { CMS_CAPABILITIES, hasAdminAccess, hasCapabilities } from './permissions'
import { CmsSessionProvider } from './session'
import type { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackModal } from './FeedbackModal'
import type { SeedOptions, SeedResult } from './seed'

function toAdminChildPath(path: string): string {
  return path.replace(/^\/admin\/?/, '')
}

export function AdminShell({
  auth,
  db,
  nav,
  pages,
  widgets,
  seed,
  seedablePlugins = [],
}: {
  auth: AuthApi
  db: SupabaseClient
  nav: NavItem[]
  pages: RouteDef[]
  widgets: WidgetDef[]
  /** The instance's seed runner; when absent the setup panel is not shown. */
  seed?: (opts?: SeedOptions) => Promise<SeedResult[]>
  seedablePlugins?: string[]
}) {
  const [session, setSession] = useState<CmsSession | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    auth.getSession().then((s) => {
      setSession(s)
      setReady(true)
    })
    return auth.onChange(setSession)
  }, [auth])

  if (!ready) return <div>Loading…</div>
  if (!session) return <LoginForm auth={auth} />
  if (!hasAdminAccess(session)) return <UnauthorizedState auth={auth} />

  const visibleNav = nav.filter((item) => hasCapabilities(session, item.requiredCapabilities))
  const visibleWidgets = widgets.filter((widget) => hasCapabilities(session, widget.requiredCapabilities))
  const canSeed = Boolean(seed) && seedablePlugins.length > 0 && hasCapabilities(session, [CMS_CAPABILITIES.settingsManage])

  return (
    <CmsSessionProvider session={session}>
      <div data-testid="admin-shell">
        <nav className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
          <Link to="/admin">Dashboard</Link>
          {visibleNav.map((n) => (
            <Link key={n.path} to={n.path}>
              {n.label}
            </Link>
          ))}
          </div>
          <button type="button" onClick={() => auth.signOut()}>
            Sign out
          </button>
        </nav>
        <Routes>
          <Route
            index
            element={
              <DashboardHome
                nav={visibleNav}
                widgets={visibleWidgets}
                setup={canSeed && seed ? { seed, plugins: seedablePlugins } : undefined}
              />
            }
          />
          {pages.map((page) => (
            <Route
              key={page.path}
              path={toAdminChildPath(page.path)}
              element={hasCapabilities(session, page.requiredCapabilities)
                ? (
                    <Suspense fallback={<ModuleLoadingState />}>
                      <page.element />
                    </Suspense>
                  )
                : <PermissionDeniedState />}
            />
          ))}
        </Routes>
        <FeedbackModal db={db} />
      </div>
    </CmsSessionProvider>
  )
}

interface SetupPanelProps {
  seed: (opts?: SeedOptions) => Promise<SeedResult[]>
  plugins: string[]
}

function DashboardHome({ nav, widgets, setup }: { nav: NavItem[]; widgets: WidgetDef[]; setup?: SetupPanelProps }) {
  return (
    <div className="p-6" data-testid="admin-dashboard">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Quick access to your CMS modules and configuration tools.</p>

      {setup && <SetupPanel {...setup} />}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {nav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:bg-accent"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{item.group}</div>
            <div className="mt-2 text-lg font-medium text-foreground">{item.label}</div>
            <div className="mt-2 text-sm text-muted-foreground">{item.path}</div>
          </Link>
        ))}
      </div>

      {widgets.length > 0 && (
        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {widgets.map((widget) => (
            <section key={widget.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Suspense fallback={<ModuleLoadingState />}>
                <widget.render />
              </Suspense>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Dashboard card that runs the plugin seed hooks. Shown only to
 * `settings.manage` holders: seeding is a one-time install step, and each
 * plugin's own RLS still decides whether the caller may insert its rows — a
 * denial shows up here as that plugin's failure line rather than a silent no-op.
 */
function SetupPanel({ seed, plugins }: SetupPanelProps) {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<SeedResult[] | null>(null)

  async function run() {
    setRunning(true)
    try {
      setResults(await seed())
    } catch (error) {
      setResults(plugins.map((plugin) => ({
        plugin,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })))
    } finally {
      setRunning(false)
    }
  }

  return (
    <section
      data-testid="admin-setup-panel"
      className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-foreground">Setup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Populate a fresh install with each module's default content. Safe to re-run: modules skip rows that already exist.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Seedable modules">
            {plugins.map((plugin) => (
              <li key={plugin} className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {plugin}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
        >
          {running ? 'Seeding…' : 'Seed default content'}
        </button>
      </div>

      {results && (
        <ul className="mt-4 space-y-1 text-sm" aria-label="Seed results">
          {results.map((result) => (
            <li key={result.plugin} className="flex flex-wrap gap-2">
              <span className="font-mono">{result.plugin}</span>
              <span className={result.status === 'seeded' ? 'text-emerald-600' : 'text-destructive'}>
                {result.status === 'seeded' ? 'seeded' : `failed — ${result.error ?? 'unknown error'}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ModuleLoadingState() {
  return (
    <div className="p-4 text-sm text-muted-foreground" data-testid="admin-module-loading-state">
      Loading module…
    </div>
  )
}

function UnauthorizedState({ auth }: { auth: AuthApi }) {
  return (
    <div data-testid="admin-unauthorized" className="p-8">
      <h1>Admin access required</h1>
      <p>Your account is signed in, but it does not have CMS admin privileges.</p>
      <button type="button" onClick={() => auth.signOut()}>
        Sign out
      </button>
    </div>
  )
}

function PermissionDeniedState() {
  return (
    <div data-testid="admin-permission-denied" className="p-8">
      <h1>Permission required</h1>
      <p>Your account can sign in to the CMS, but it cannot access this page.</p>
    </div>
  )
}

function LoginForm({ auth }: { auth: AuthApi }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const { error } = await auth.signIn(email, password)
        setError(error)
      }}
    >
      <input aria-label="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input aria-label="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
