import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthApi, CmsSession } from './types'

function toCmsSession(session: unknown): CmsSession | null {
  if (!session || typeof session !== 'object') return null
  const maybeSession = session as Partial<CmsSession>
  if (!maybeSession.user || typeof maybeSession.user !== 'object') return null
  if (typeof maybeSession.user.id !== 'string') return null
  return maybeSession as CmsSession
}

export function createAuth(client: SupabaseClient): AuthApi {
  return {
    async getSession() {
      const { data } = await client.auth.getSession()
      return toCmsSession(data.session)
    },
    onChange(cb) {
      const { data } = client.auth.onAuthStateChange((_event, session) => cb(toCmsSession(session)))
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
