import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthApi } from './types'

export function createAuth(client: SupabaseClient): AuthApi {
  return {
    async getSession() {
      const { data } = await client.auth.getSession()
      return data.session
    },
    onChange(cb) {
      const { data } = client.auth.onAuthStateChange((_event, session) => cb(session))
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
