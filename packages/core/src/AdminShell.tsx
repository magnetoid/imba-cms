import { useEffect, useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import type { AuthApi, CmsSession, NavItem, RouteDef, WidgetDef } from './types'
import { hasAdminAccess, hasCapabilities } from './permissions'
import { CmsSessionProvider } from './session'

function toAdminChildPath(path: string): string {
  return path.replace(/^\/admin\/?/, '')
}

export function AdminShell({
  auth,
  nav,
  pages,
  widgets,
}: {
  auth: AuthApi
  nav: NavItem[]
  pages: RouteDef[]
  widgets: WidgetDef[]
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
          <Route index element={<DashboardHome nav={visibleNav} widgets={visibleWidgets} />} />
          {pages.map((page) => (
            <Route
              key={page.path}
              path={toAdminChildPath(page.path)}
              element={hasCapabilities(session, page.requiredCapabilities) ? <page.element /> : <PermissionDeniedState />}
            />
          ))}
        </Routes>
      </div>
    </CmsSessionProvider>
  )
}

function DashboardHome({ nav, widgets }: { nav: NavItem[]; widgets: WidgetDef[] }) {
  return (
    <div className="p-6" data-testid="admin-dashboard">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Quick access to your CMS modules and configuration tools.</p>

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
              <widget.render />
            </section>
          ))}
        </div>
      )}
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
