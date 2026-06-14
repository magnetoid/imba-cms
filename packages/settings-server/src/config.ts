import { createClient } from '@supabase/supabase-js'

export interface SettingsServerConfig {
  supabaseUrl: string
  serviceRoleKey: string
  port: number
  corsOrigin: string
}

function readRequired(name: string, fallback?: string) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined)
  if (!value) throw new Error(`Missing required environment variable: ${name}${fallback ? ` (or ${fallback})` : ''}`)
  return value
}

export function readConfig(): SettingsServerConfig {
  return {
    supabaseUrl: readRequired('IMBA_SUPABASE_URL', 'SUPABASE_URL'),
    serviceRoleKey: readRequired('IMBA_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'),
    port: Number(process.env.IMBA_SETTINGS_PORT ?? '8790'),
    corsOrigin: process.env.IMBA_SETTINGS_CORS_ORIGIN ?? '*',
  }
}

export function createServiceClient(config: SettingsServerConfig) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
