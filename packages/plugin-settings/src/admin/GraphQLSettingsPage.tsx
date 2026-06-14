import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@imba/ui'
import {
  DEFAULT_GRAPHQL_SETTINGS,
  type ConnectionTestResult,
  type GraphqlSettings,
} from '../shared'
import { type GraphqlSettingsView, fetchGraphqlSettings, runGraphqlConnectionTest, updateGraphqlSettings } from '../api'
import { SettingsLayout } from './SettingsLayout'

function StatusMessage({ result }: { result: ConnectionTestResult | null }) {
  if (!result) return null
  return (
    <p className={result.ok ? 'text-sm text-primary' : 'text-sm text-destructive'} role="status">
      {result.message}
      {result.status ? ` (HTTP ${result.status})` : ''}
    </p>
  )
}

export default function GraphQLSettingsPage() {
  const [initialValue, setInitialValue] = useState<GraphqlSettingsView>({
    ...DEFAULT_GRAPHQL_SETTINGS,
    hasToken: false,
    hasPassword: false,
  })
  const [form, setForm] = useState<GraphqlSettingsView>({
    ...DEFAULT_GRAPHQL_SETTINGS,
    hasToken: false,
    hasPassword: false,
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionTestResult | null>(null)

  useEffect(() => {
    fetchGraphqlSettings()
      .then((value) => {
        setInitialValue(value)
        setForm(value)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load GraphQL settings.')
      })
  }, [])

  function update<K extends keyof GraphqlSettingsView>(key: K, value: GraphqlSettingsView[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const saved = await updateGraphqlSettings(form)
      setInitialValue(saved)
      setForm(saved)
      setStatus({ ok: true, message: 'GraphQL settings saved successfully.' })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save GraphQL settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setError(null)
    setStatus(null)
    try {
      setStatus(await runGraphqlConnectionTest(form))
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Connection test failed.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <SettingsLayout
      title="GraphQL settings"
      description="Configure the GraphQL server used by the CMS and verify connectivity before saving changes."
    >
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>All credentials are stored in private CMS settings and are only readable by admins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              id="graphql-enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => update('enabled', event.target.checked)}
            />
            <Label htmlFor="graphql-enabled">Enable GraphQL integration</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="graphql-endpoint">Server URL</Label>
              <Input
                id="graphql-endpoint"
                type="url"
                value={form.endpointUrl}
                onChange={(event) => update('endpointUrl', event.target.value)}
                placeholder="https://api.example.com/graphql"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graphql-auth-mode">Authentication</Label>
              <select
                id="graphql-auth-mode"
                value={form.authMode}
                onChange={(event) => update('authMode', event.target.value as GraphqlSettings['authMode'])}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="none">No authentication</option>
                <option value="bearer">Bearer token</option>
                <option value="basic">Basic auth</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graphql-timeout">Timeout (ms)</Label>
              <Input
                id="graphql-timeout"
                type="number"
                min={1000}
                max={30000}
                value={form.timeoutMs}
                onChange={(event) => update('timeoutMs', Number(event.target.value))}
              />
            </div>

            {form.authMode === 'bearer' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="graphql-token">Bearer token</Label>
                <Input
                  id="graphql-token"
                  type="password"
                  value={form.token ?? ''}
                  onChange={(event) => update('token', event.target.value)}
                  placeholder={form.hasToken ? 'Saved token will be kept unless replaced' : 'Paste the API token'}
                />
              </div>
            )}

            {form.authMode === 'basic' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="graphql-username">Username</Label>
                  <Input
                    id="graphql-username"
                    value={form.username ?? ''}
                    onChange={(event) => update('username', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graphql-password">Password</Label>
                  <Input
                    id="graphql-password"
                    type="password"
                    value={form.password ?? ''}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder={form.hasPassword ? 'Saved password will be kept unless replaced' : 'Enter password'}
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <StatusMessage result={status} />

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test connection'}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm(initialValue)
                setError(null)
                setStatus(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  )
}
