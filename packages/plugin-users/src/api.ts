import type { CmsRole } from '@imba/core'
import { getUsersAccessToken, getUsersApiBaseUrl } from './client'
import type { ManagedUser } from './types'

async function parseError(response: Response) {
  try {
    const payload = await response.json()
    if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
      return payload.error
    }
  } catch {
    // Fall through to status text.
  }
  return response.statusText || 'Request failed.'
}

async function usersRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getUsersAccessToken()
  if (!accessToken) throw new Error('You must be signed in as an admin to manage users.')

  const response = await fetch(`${getUsersApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) throw new Error(await parseError(response))
  return response.json() as Promise<T>
}

export async function fetchUsers(): Promise<ManagedUser[]> {
  const { items } = await usersRequest<{ items: ManagedUser[] }>('')
  return items
}

export async function setUserRole(userId: string, role: CmsRole | null): Promise<void> {
  await usersRequest<{ ok: true }>(`/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}

export async function inviteUser(email: string, role: CmsRole): Promise<ManagedUser> {
  const { item } = await usersRequest<{ item: ManagedUser }>('/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
  return item
}
