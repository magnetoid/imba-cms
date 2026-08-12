import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function resolveSupabaseUrl(buildUrl: string | undefined, origin: string): string {
  const isPlaceholder = !buildUrl || buildUrl.includes('placeholder') || buildUrl.includes('undefined')
  return isPlaceholder ? `${origin}/supabase` : buildUrl
}

export function createDb(opts: {
  url?: string
  anonKey: string
  origin?: string
  /** See `supabaseConfigSchema`: opts into the `<origin>/supabase` proxy. */
  allowOriginProxy?: boolean
}): SupabaseClient {
  const origin = opts.origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const url = resolveSupabaseUrl(opts.url, origin)

  // Belt and braces behind `assertValidCmsConfig`: `createDb` is exported, so it
  // can be called directly. It must never substitute a fake key — doing so
  // turned a configuration error into a confusing runtime 401.
  if (!opts.anonKey || opts.anonKey.trim().length === 0) {
    throw new Error('createDb: supabase anonKey is required (set VITE_SUPABASE_ANON_KEY).')
  }

  return createClient(url, opts.anonKey)
}
