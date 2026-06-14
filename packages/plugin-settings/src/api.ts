import type { ConnectionTestResult, GraphqlSettings, McpSettings } from './shared'
import { getSettingsAccessToken, getSettingsApiBaseUrl } from './client'

export interface GraphqlSettingsView extends GraphqlSettings {
  hasToken: boolean
  hasPassword: boolean
}

export interface McpSettingsView extends McpSettings {
  hasToken: boolean
  hasPassword: boolean
}

async function parseError(response: Response) {
  try {
    const payload = await response.json()
    if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
      return payload.error
    }
  } catch {
    // Ignore JSON parse failures and fall back to status text.
  }
  return response.statusText || 'Request failed.'
}

async function settingsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getSettingsAccessToken()
  if (!accessToken) throw new Error('You must be signed in as an admin to manage settings.')

  const response = await fetch(`${getSettingsApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json() as Promise<T>
}

export function fetchGraphqlSettings() {
  return settingsRequest<GraphqlSettingsView>('/graphql')
}

export function updateGraphqlSettings(value: GraphqlSettings) {
  return settingsRequest<GraphqlSettingsView>('/graphql', {
    method: 'PUT',
    body: JSON.stringify(value),
  })
}

export function runGraphqlConnectionTest(value: GraphqlSettings) {
  return settingsRequest<ConnectionTestResult>('/graphql/test', {
    method: 'POST',
    body: JSON.stringify(value),
  })
}

export function fetchMcpSettings() {
  return settingsRequest<McpSettingsView>('/mcp')
}

export function updateMcpSettings(value: McpSettings) {
  return settingsRequest<McpSettingsView>('/mcp', {
    method: 'PUT',
    body: JSON.stringify(value),
  })
}

export function runMcpConnectionTest(value: McpSettings) {
  return settingsRequest<ConnectionTestResult>('/mcp/test', {
    method: 'POST',
    body: JSON.stringify(value),
  })
}
