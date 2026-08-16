import type { AuthApi } from '@imba/core'
import { readBrowserRuntimeOptionalValue } from '@imba/core'

let _auth: AuthApi | null = null
let _baseUrl = '/api/users'

/**
 * Called from the plugin's `register` hook. The base URL defaults to a
 * same-origin `/api/users` (a reverse proxy in front of `@imba/settings-server`,
 * matching `@imba/plugin-settings`), and can be pointed elsewhere at runtime
 * with `IMBA_USERS_API_URL`.
 */
export function configureUsersClient(config: { auth: AuthApi; baseUrl?: string }) {
  _auth = config.auth
  _baseUrl = config.baseUrl ?? readBrowserRuntimeOptionalValue('IMBA_USERS_API_URL') ?? '/api/users'
}

export async function getUsersAccessToken() {
  if (!_auth) throw new Error('@imba/plugin-users auth not registered')
  const session = await _auth.getSession()
  return session?.access_token ?? null
}

export function getUsersApiBaseUrl() {
  return _baseUrl
}
