import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function resolveSupabaseUrl(buildUrl: string | undefined, origin: string): string {
  const isPlaceholder = !buildUrl || buildUrl.includes('placeholder') || buildUrl.includes('undefined')
  return isPlaceholder ? `${origin}/supabase` : buildUrl
}

export function createDb(opts: { url?: string; anonKey: string; origin?: string }): SupabaseClient {
  const origin = opts.origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const url = resolveSupabaseUrl(opts.url, origin)
  return createClient(url, opts.anonKey || 'placeholder')
}
