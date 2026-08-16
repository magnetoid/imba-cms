import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminShell } from './AdminShell'
import type { AuthApi, CmsSession, NavItem, RouteDef } from './types'
import { CMS_CAPABILITIES } from './permissions'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeAuth(session: CmsSession | null): AuthApi {
  return {
    getSession: vi.fn().mockResolvedValue(session),
    onChange: vi.fn().mockReturnValue(() => {}),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}

const mockDb = {
  from: () => ({ insert: async () => ({ error: null }) })
} as unknown as SupabaseClient

function renderAdminShell({
  initialEntry,
  auth,
  nav,
  pages,
  widgets = [],
}: {
  initialEntry: string
  auth: AuthApi
  nav: NavItem[]
  pages: RouteDef[]
  widgets?: { id: string; render: () => JSX.Element }[]
}) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/*" element={<AdminShell auth={auth} db={mockDb} nav={nav} pages={pages} widgets={widgets} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminShell', () => {
  it('renders the login form when there is no session', async () => {
    renderAdminShell({ initialEntry: '/admin', auth: makeAuth(null), nav: [], pages: [], widgets: [] })

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeDefined()
    expect(screen.getByLabelText('email')).toBeDefined()
  })

  it('shows an unauthorized state for signed-in non-admin users', async () => {
    renderAdminShell({
      initialEntry: '/admin',
      auth: makeAuth({ user: { id: 'u1', email: 'editor@example.com', app_metadata: { role: 'editor' } } }),
      nav: [],
      pages: [],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-unauthorized')).toBeDefined()
    expect(screen.getByText(/admin access required/i)).toBeDefined()
  })

  it('renders admin navigation for admin sessions and supports sign out', async () => {
    const auth = makeAuth({ user: { id: 'u1', email: 'admin@example.com', app_metadata: { is_admin: true } } })

    renderAdminShell({
      initialEntry: '/admin/posts',
      auth,
      nav: [{ group: 'Content', label: 'Posts', path: '/admin/posts' }],
      pages: [{ path: '/admin/posts', element: () => <div>Posts page</div> }],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-shell')).toBeDefined()
    expect(screen.getByText('Posts')).toBeDefined()
    expect(screen.getByText('Posts page')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('allows capability-based CMS access and filters navigation by permission', async () => {
    renderAdminShell({
      initialEntry: '/admin/posts',
      auth: makeAuth({
        user: {
          id: 'u1',
          email: 'editor@example.com',
          app_metadata: { permissions: [CMS_CAPABILITIES.blogRead] },
        },
      }),
      nav: [
        { group: 'Content', label: 'Posts', path: '/admin/posts', requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
        { group: 'System', label: 'Settings', path: '/admin/settings', requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      ],
      pages: [
        { path: '/admin/posts', element: () => <div>Posts page</div>, requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
        { path: '/admin/settings', element: () => <div>Settings page</div>, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      ],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-shell')).toBeDefined()
    expect(screen.getByText('Posts')).toBeDefined()
    expect(screen.queryByText('Settings')).toBeNull()
    expect(screen.getByText('Posts page')).toBeDefined()
  })

  it('shows a permission denied state for routes outside the user capability set', async () => {
    renderAdminShell({
      initialEntry: '/admin/settings',
      auth: makeAuth({
        user: {
          id: 'u1',
          email: 'editor@example.com',
          app_metadata: { permissions: [CMS_CAPABILITIES.blogRead] },
        },
      }),
      nav: [],
      pages: [
        { path: '/admin/settings', element: () => <div>Settings page</div>, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      ],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-permission-denied')).toBeDefined()
    expect(screen.getByText(/permission required/i)).toBeDefined()
  })

  it('hides system navigation from a cms_role that lacks it', async () => {
    // Regression: before ROLE_CAPABILITIES existed, any cms_role short-circuited
    // hasCapability to true, so an editor saw — and could open — Settings.
    renderAdminShell({
      initialEntry: '/admin/posts',
      auth: makeAuth({
        user: { id: 'u1', email: 'editor@example.com' },
        cms_role: 'editor',
      }),
      nav: [
        { group: 'Content', label: 'Posts', path: '/admin/posts', requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
        { group: 'System', label: 'Settings', path: '/admin/settings', requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      ],
      pages: [
        { path: '/admin/posts', element: () => <div>Posts page</div>, requiredCapabilities: [CMS_CAPABILITIES.blogRead] },
      ],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-shell')).toBeDefined()
    expect(screen.getByText('Posts')).toBeDefined()
    expect(screen.queryByText('Settings')).toBeNull()
  })

  it('denies a direct route hit that the cms_role does not cover', async () => {
    renderAdminShell({
      initialEntry: '/admin/settings',
      auth: makeAuth({ user: { id: 'u1', email: 'editor@example.com' }, cms_role: 'editor' }),
      nav: [],
      pages: [
        { path: '/admin/settings', element: () => <div>Settings page</div>, requiredCapabilities: [CMS_CAPABILITIES.settingsManage] },
      ],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-permission-denied')).toBeDefined()
    expect(screen.queryByText('Settings page')).toBeNull()
  })

  it('renders a dashboard home with quick links', async () => {
    renderAdminShell({
      initialEntry: '/admin',
      auth: makeAuth({ user: { id: 'u1', email: 'admin@example.com', app_metadata: { is_admin: true } } }),
      nav: [{ group: 'System', label: 'Settings', path: '/admin/settings' }],
      pages: [],
      widgets: [],
    })

    expect(await screen.findByTestId('admin-dashboard')).toBeDefined()
    expect(within(screen.getByTestId('admin-dashboard')).getByText('Settings')).toBeDefined()
  })
})

describe('AdminShell setup panel', () => {
  const superAdmin = makeAuth({ user: { id: 'u1', email: 'root@example.com' }, cms_role: 'super_admin' })

  it('lets a settings.manage holder run the plugin seeds from the dashboard', async () => {
    const seed = vi.fn().mockResolvedValue([
      { plugin: 'pages', status: 'seeded' },
      { plugin: 'blog', status: 'failed', error: 'permission denied for table blog_posts' },
    ])
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={
            <AdminShell auth={superAdmin} db={mockDb} nav={[]} pages={[]} widgets={[]} seed={seed} seedablePlugins={['pages', 'blog']} />
          } />
        </Routes>
      </MemoryRouter>,
    )
    const panel = await screen.findByTestId('admin-setup-panel')
    expect(within(panel).getByText('pages')).toBeDefined()
    expect(within(panel).getByText('blog')).toBeDefined()

    fireEvent.click(within(panel).getByRole('button', { name: /seed default content/i }))
    expect(await within(panel).findByText(/permission denied for table blog_posts/)).toBeDefined()
    expect(within(panel).getByText(/seeded/i)).toBeDefined()
    expect(seed).toHaveBeenCalledOnce()
  })

  it('hides the setup panel from sessions without settings.manage', async () => {
    const editor = makeAuth({ user: { id: 'u2', email: 'editor@example.com' }, cms_role: 'editor' })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={
            <AdminShell auth={editor} db={mockDb} nav={[]} pages={[]} widgets={[]} seed={vi.fn()} seedablePlugins={['pages']} />
          } />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByTestId('admin-dashboard')).toBeDefined()
    expect(screen.queryByTestId('admin-setup-panel')).toBeNull()
  })

  it('omits the panel entirely when no plugin can be seeded', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={
            <AdminShell auth={superAdmin} db={mockDb} nav={[]} pages={[]} widgets={[]} seed={vi.fn()} seedablePlugins={[]} />
          } />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByTestId('admin-dashboard')).toBeDefined()
    expect(screen.queryByTestId('admin-setup-panel')).toBeNull()
  })
})
