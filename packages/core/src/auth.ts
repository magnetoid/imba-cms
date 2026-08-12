import type { SupabaseClient } from '@supabase/supabase-js'
import { parseCmsRole } from './permissions'
import type { AuthApi, CmsRole, CmsSession } from './types'

function toCmsSession(session: unknown, cmsRole?: CmsRole): CmsSession | null {
  if (!session || typeof session !== 'object') return null
  const maybeSession = session as Partial<CmsSession>
  if (!maybeSession.user || typeof maybeSession.user !== 'object') return null
  if (typeof maybeSession.user.id !== 'string') return null
  const out = maybeSession as CmsSession
  if (cmsRole) out.cms_role = cmsRole
  return out
}

async function loadCmsRole(client: SupabaseClient, userId: string): Promise<CmsRole | undefined> {
  if (typeof client.from !== 'function') return undefined

  try {
    const { data } = await client
      .from('cms_user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    return parseCmsRole(data?.role)
  } catch {
    return undefined
  }
}

export function createAuth(client: SupabaseClient): AuthApi {
  return {
    async getSession() {
      const { data } = await client.auth.getSession()
      if (!data.session) return null
      const cmsRole = await loadCmsRole(client, data.session.user.id)
      return toCmsSession(data.session, cmsRole)
    },
    onChange(cb) {
      const { data } = client.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          cb(null)
          return
        }
        const cmsRole = await loadCmsRole(client, session.user.id)
        cb(toCmsSession(session, cmsRole))
      })
      return () => data.subscription.unsubscribe()
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      return { error: error ? error.message : null }
    },
    async signOut() {
      await client.auth.signOut()
    },
  }
}
