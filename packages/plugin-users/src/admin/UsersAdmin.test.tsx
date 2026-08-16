import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CmsSessionProvider } from '@imba/core'
import UsersAdmin from './UsersAdmin'

const apiMocks = vi.hoisted(() => ({
  fetchUsers: vi.fn(),
  setUserRole: vi.fn(),
  inviteUser: vi.fn(),
}))
vi.mock('../api', () => apiMocks)

const users = [
  { id: 'me', email: 'root@example.com', role: 'super_admin', createdAt: '2026-01-01T00:00:00Z', lastSignInAt: '2026-03-01T00:00:00Z', confirmedAt: '2026-01-01T00:00:00Z', invitedAt: null },
  { id: 'u2', email: 'writer@example.com', role: null, createdAt: '2026-01-05T00:00:00Z', lastSignInAt: null, confirmedAt: null, invitedAt: '2026-01-05T00:00:00Z' },
]

function renderPage() {
  return render(
    <CmsSessionProvider session={{ user: { id: 'me', email: 'root@example.com' }, cms_role: 'super_admin' }}>
      <UsersAdmin />
    </CmsSessionProvider>,
  )
}

describe('UsersAdmin', () => {
  beforeEach(() => {
    apiMocks.fetchUsers.mockResolvedValue(users)
    apiMocks.setUserRole.mockResolvedValue(undefined)
    apiMocks.inviteUser.mockResolvedValue({ id: 'u3', email: 'new@example.com', role: 'author', createdAt: null, lastSignInAt: null, confirmedAt: null, invitedAt: '2026-04-01T00:00:00Z' })
  })

  it('lists accounts with their role and marks the current user', async () => {
    renderPage()
    const row = await screen.findByTestId('user-row-me')
    expect(within(row).getByText('you')).toBeDefined()
    expect((within(row).getByLabelText('Role for root@example.com') as HTMLSelectElement).value).toBe('super_admin')
    const other = screen.getByTestId('user-row-u2')
    expect((within(other).getByLabelText('Role for writer@example.com') as HTMLSelectElement).value).toBe('__none__')
    expect(within(other).getByText(/Invited/)).toBeDefined()
  })

  it('changes a role through the API and confirms it', async () => {
    renderPage()
    const select = await screen.findByLabelText('Role for writer@example.com')
    fireEvent.change(select, { target: { value: 'editor' } })
    await waitFor(() => expect(apiMocks.setUserRole).toHaveBeenCalledWith('u2', 'editor'))
    expect((await screen.findByRole('status')).textContent).toMatch(/writer@example.com is now editor/)
  })

  it('shows the server error when a change is refused', async () => {
    apiMocks.setUserRole.mockRejectedValue(new Error('Cannot remove the last super_admin'))
    renderPage()
    const select = await screen.findByLabelText('Role for root@example.com')
    fireEvent.change(select, { target: { value: '__none__' } })
    expect((await screen.findByRole('alert')).textContent).toMatch(/last super_admin/)
  })

  it('invites a user with a role and appends them to the list', async () => {
    renderPage()
    await screen.findByTestId('user-row-me')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'author' } })
    fireEvent.click(screen.getByRole('button', { name: /send invite/i }))
    await waitFor(() => expect(apiMocks.inviteUser).toHaveBeenCalledWith('new@example.com', 'author'))
    expect(await screen.findByTestId('user-row-u3')).toBeDefined()
  })
})
