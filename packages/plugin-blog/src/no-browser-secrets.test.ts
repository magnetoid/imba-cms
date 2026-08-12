// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = dirname(fileURLToPath(import.meta.url))

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(full)))
      continue
    }
    // Specs are excluded: this one names the forbidden tokens in its own
    // assertions, and fixtures legitimately contain hostile sample strings.
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue
    if (['.ts', '.tsx'].includes(extname(entry.name))) files.push(full)
  }

  return files
}

describe('no third-party API credentials in the browser bundle', () => {
  it('holds no LLM provider key or endpoint', async () => {
    // The blog admin used to keep an `sk-ant-` key in localStorage and call the
    // provider directly from the page with a browser-access override. Any XSS on
    // the admin origin exfiltrated a billable credential. The generator was
    // removed; if it returns, it must be a server-side endpoint behind a
    // capability check, never a key shipped to the browser.
    const forbidden = [/sk-ant-/i, /api\.anthropic\.com/i, /dangerous-allow-browser/i, /x-api-key/i]

    for (const file of await sourceFiles(SRC)) {
      const source = await readFile(file, 'utf8')
      for (const pattern of forbidden) {
        expect(source, `${file} must not contain ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('persists nothing to localStorage', async () => {
    for (const file of await sourceFiles(SRC)) {
      const source = await readFile(file, 'utf8')
      expect(source, `${file} must not use localStorage`).not.toMatch(/localStorage/)
    }
  })
})
