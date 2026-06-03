/**
 * DB safety scanner. Updates are ADDITIVE-ONLY: any migration containing
 * destructive SQL is refused unless the operator passes `--force`.
 *
 * Detected destructive operations (case-insensitive):
 *   - DROP TABLE
 *   - DROP COLUMN
 *   - ALTER TABLE ... DROP        (drop constraint / column via ALTER)
 *   - DELETE FROM
 *   - TRUNCATE
 *
 * Matches inside SQL line comments (`-- ...`) are ignored so documentation or
 * commented-out statements never trip the guard.
 */

export interface DestructiveScan {
  destructive: boolean
  reasons: string[]
}

interface Rule {
  // Regex applied per-line, case-insensitive.
  re: RegExp
  reason: string
}

const RULES: Rule[] = [
  { re: /\bDROP\s+TABLE\b/i, reason: 'DROP TABLE' },
  { re: /\bDROP\s+COLUMN\b/i, reason: 'DROP COLUMN' },
  // ALTER TABLE ... DROP (constraint / column / default). The DROP COLUMN rule
  // above also covers the column case; this catches `DROP CONSTRAINT` etc.
  { re: /\bALTER\s+TABLE\b[\s\S]*?\bDROP\b/i, reason: 'ALTER TABLE ... DROP' },
  { re: /\bDELETE\s+FROM\b/i, reason: 'DELETE FROM' },
  { re: /\bTRUNCATE\b/i, reason: 'TRUNCATE' },
]

/**
 * Strip the line comment portion (`-- ...` to end of line) from a single line.
 */
function stripLineComment(line: string): string {
  const idx = line.indexOf('--')
  return idx === -1 ? line : line.slice(0, idx)
}

/**
 * Scan a SQL string for destructive operations. Returns whether it is
 * destructive plus a human-readable reason per distinct rule hit.
 */
export function isDestructiveSql(sql: string): DestructiveScan {
  const reasons: string[] = []
  const seen = new Set<string>()

  // Remove comment text line-by-line so keywords inside `-- ...` are ignored.
  const code = sql
    .split(/\r?\n/)
    .map(stripLineComment)
    .join('\n')

  for (const rule of RULES) {
    if (rule.re.test(code) && !seen.has(rule.reason)) {
      seen.add(rule.reason)
      reasons.push(rule.reason)
    }
  }

  return { destructive: reasons.length > 0, reasons }
}

export interface MigrationLike {
  id: string
  sql: string
}

export interface DestructiveMigration {
  id: string
  reasons: string[]
}

/**
 * Inspect a list of migrations for destructive SQL.
 *
 * Returns the list of destructive migrations found (for dry-run reporting).
 * If any are destructive and `opts.force` is not set, THROWS an Error naming
 * the offending migration ids and reasons.
 */
export function assertAdditive(
  migrations: MigrationLike[],
  opts: { force?: boolean } = {},
): DestructiveMigration[] {
  const destructive: DestructiveMigration[] = []
  for (const m of migrations) {
    const scan = isDestructiveSql(m.sql)
    if (scan.destructive) {
      destructive.push({ id: m.id, reasons: scan.reasons })
    }
  }

  if (destructive.length > 0 && !opts.force) {
    const detail = destructive
      .map((d) => `  - ${d.id}: ${d.reasons.join(', ')}`)
      .join('\n')
    throw new Error(
      `Refusing to apply destructive migration(s) (updates are additive-only). ` +
        `Re-run with --force to override:\n${detail}`,
    )
  }

  return destructive
}
