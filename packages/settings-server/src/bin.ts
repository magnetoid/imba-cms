#!/usr/bin/env node
import { createServiceClient, readConfig } from './config.js'
import { startSettingsServer } from './server.js'

async function main() {
  const config = readConfig()
  const db = createServiceClient(config)
  await startSettingsServer(db, config)
  process.stderr.write(`imba-settings-server: listening on http://localhost:${config.port}/api/settings\n`)
}

main().catch((error) => {
  process.stderr.write(`imba-settings-server: fatal: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
