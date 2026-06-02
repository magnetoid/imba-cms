import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { AuthApi, NavItem, RouteDef } from './types'

export function AdminShell({ auth, nav, pages }: { auth: AuthApi; nav: NavItem[]; pages: RouteDef[] }) {
  const [session, setSession] = useState<unknown>(null)
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

  return (
    <div data-testid="admin-shell">
      <nav>
        {nav.map((n) => (
          <a key={n.path} href={n.path}>
            {n.label}
          </a>
        ))}
      </nav>
      <Routes>
        {pages.map((p) => (
          <Route key={p.path} path={p.path.replace(/^\/admin/, '')} element={<p.element />} />
        ))}
      </Routes>
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
