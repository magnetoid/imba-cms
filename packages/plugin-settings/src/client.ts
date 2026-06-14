import type { AuthApi } from '@imba/core'

let _auth: AuthApi | null = null
let _baseUrl = '/api/settings'

export function configureSettingsClient(config: { auth: AuthApi; baseUrl?: string }) {
  _auth = config.auth
  _baseUrl = config.baseUrl ?? '/api/settings'
}

export async function getSettingsAccessToken() {
  if (!_auth) throw new Error('@imba/plugin-settings auth not registered')
  const session = await _auth.getSession()
  return session?.access_token ?? null
}

export function getSettingsApiBaseUrl() {
  return _baseUrl
}
