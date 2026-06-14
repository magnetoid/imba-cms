import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@imba/ui'
import { fetchGraphqlSettings, fetchMcpSettings } from '../api'
import { SettingsLayout } from './SettingsLayout'

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={configured
        ? 'inline-flex rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground'
        : 'inline-flex rounded-full border border-input px-2 py-1 text-xs font-medium text-muted-foreground'}
    >
      {configured ? 'Configured' : 'Not configured'}
    </span>
  )
}

export default function SettingsHome() {
  const [status, setStatus] = useState({ graphql: false, mcp: false })

  useEffect(() => {
    Promise.all([fetchGraphqlSettings(), fetchMcpSettings()])
      .then(([graphql, mcp]) => {
        setStatus({
          graphql: Boolean(graphql.enabled && graphql.endpointUrl),
          mcp: Boolean(mcp.enabled && mcp.endpointUrl),
        })
      })
      .catch(() => {
        setStatus({ graphql: false, mcp: false })
      })
  }, [])

  return (
    <SettingsLayout
      title="Integrations"
      description="Manage external service configuration for GraphQL delivery and MCP server access."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>GraphQL configuration</span>
              <StatusBadge configured={status.graphql} />
            </CardTitle>
            <CardDescription>Configure the GraphQL endpoint, authentication, and connectivity checks.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Control how the CMS connects to your GraphQL API surface.</p>
            <Button asChild>
              <Link to="/admin/settings/graphql">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>MCP server configuration</span>
              <StatusBadge configured={status.mcp} />
            </CardTitle>
            <CardDescription>Configure the MCP endpoint, transport mode, and secure connection testing.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Manage remote MCP server access used by automation and AI tooling.</p>
            <Button asChild>
              <Link to="/admin/settings/mcp">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
