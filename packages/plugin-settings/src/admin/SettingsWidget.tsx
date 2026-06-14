import { Link } from 'react-router-dom'
import { Button } from '@imba/ui'

export default function SettingsWidget() {
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold">Settings</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage GraphQL and MCP server configuration from the main admin dashboard.
        </p>
      </div>
      <Button asChild>
        <Link to="/admin/settings">Open settings</Link>
      </Button>
    </div>
  )
}
