import type { CmsRole } from '@imba/core'

/** Mirrors `ManagedUser` from `@imba/settings-server`. */
export interface ManagedUser {
  id: string
  email: string | null
  role: CmsRole | null
  createdAt: string | null
  lastSignInAt: string | null
  confirmedAt: string | null
  invitedAt: string | null
}
