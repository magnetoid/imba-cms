import type { SupabaseClient } from '@supabase/supabase-js'
let _db: SupabaseClient | null = null
export function setBlogDb(db: SupabaseClient) { _db = db }
export function blogDb(): SupabaseClient {
  if (!_db) throw new Error('plugin-blog: db not initialized — did createCMS run the plugin register hook?')
  return _db
}
