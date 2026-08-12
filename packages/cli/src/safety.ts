/**
 * DB safety scanner. Updates are ADDITIVE-ONLY: any migration containing
 * destructive SQL is refused unless the operator passes `--force`.
 *
 * Detected destructive operations (case-insensitive):
 *   - DROP TABLE / SCHEMA / DATABASE
 *   - DROP COLUMN, and ALTER TABLE ... DROP COLUMN | DROP CONSTRAINT
 *   - DELETE FROM
 *   - TRUNCATE
 *
 * Rules are applied **per statement**, not per file. The original version
 * matched `/ALTER\s+TABLE[\s\S]*?DROP/` against the whole file, so an
 * `alter table x enable row level security` on one line paired with an
 * unrelated `drop policy if exists` twenty lines later. That flagged 7 of this
 * repo's own 12 migrations as destructive — the guard was not merely leaky, it
 * refused the idempotent `drop policy / create policy` idiom used throughout.
 *
 * Idempotent redefinitions (`DROP POLICY|TRIGGER|FUNCTION|INDEX|VIEW ... IF
 * EXISTS`) are explicitly NOT destructive: they destroy no data and are the
 * standard way to make a migration re-appliable.
 *
 * Comments (`-- ...` and block comments) and dollar-quoted function bodies are
 * stripped before splitting, so a `;` inside a `$$ ... $$` body cannot split a
 * statement and a keyword inside a comment cannot trip a rule.
 */

export interface DestructiveScan {
  destructive: boolean
  reasons: string[]
}

interface Rule {
  re: RegExp
  reason: string
}

const RULES: Rule[] = [
  { re: /\bDROP\s+(?:TABLE|SCHEMA|DATABASE)\b/i, reason: 'DROP TABLE' },
  { re: /\bDROP\s+COLUMN\b/i, reason: 'DROP COLUMN' },
  { re: /\bALTER\s+TABLE\b[\s\S]*\bDROP\s+CONSTRAINT\b/i, reason: 'ALTER TABLE ... DROP CONSTRAINT' },
  { re: /\bDELETE\s+FROM\b/i, reason: 'DELETE FROM' },
  { re: /\bTRUNCATE\b/i, reason: 'TRUNCATE' },
]

const DROP_CONSTRAINT_RE = /\bDROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?"?([A-Za-z_][A-Za-z0-9_]*)"?/i
const ADD_CONSTRAINT_RE = /\bADD\s+CONSTRAINT\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi

/**
 * Names of constraints (re-)added anywhere in the file.
 *
 * A `DROP CONSTRAINT IF EXISTS x` paired with an `ADD CONSTRAINT x` in the same
 * migration is an idempotent redefinition — the same pattern as
 * `drop policy if exists` + `create policy` — and destroys no data. Without this
 * downgrade the guard refuses `blog.V002`, which widens a status CHECK.
 */
function constraintsAddedIn(strippedSql: string): Set<string> {
  const names = new Set<string>()
  for (const match of strippedSql.matchAll(ADD_CONSTRAINT_RE)) {
    names.add(match[1]!.toLowerCase())
  }
  return names
}

function isRedefinition(statement: string, readded: ReadonlySet<string>): boolean {
  const dropped = DROP_CONSTRAINT_RE.exec(statement)
  return dropped ? readded.has(dropped[1]!.toLowerCase()) : false
}

/**
 * Blanks comments and dollar-quoted bodies while preserving the rest verbatim.
 *
 * Dollar quoting must be handled before comment stripping: a function body can
 * legitimately contain `--` inside a string, and can certainly contain `;`.
 */
function stripNonCode(sql: string): string {
  let out = ''
  let i = 0

  while (i < sql.length) {
    const rest = sql.slice(i)

    // Dollar-quoted body: $tag$ ... $tag$
    const dollar = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(rest)
    if (dollar) {
      const tag = dollar[0]
      const end = sql.indexOf(tag, i + tag.length)
      // Unterminated body: drop the remainder rather than mis-parsing it.
      i = end === -1 ? sql.length : end + tag.length
      continue
    }

    // Line comment
    if (rest.startsWith('--')) {
      const nl = sql.indexOf('\n', i)
      i = nl === -1 ? sql.length : nl
      continue
    }

    // Block comment (Postgres allows nesting)
    if (rest.startsWith('/*')) {
      let depth = 1
      let j = i + 2
      while (j < sql.length && depth > 0) {
        if (sql.startsWith('/*', j)) { depth++; j += 2 }
        else if (sql.startsWith('*/', j)) { depth--; j += 2 }
        else j++
      }
      i = j
      continue
    }

    // Single-quoted string, '' escapes an embedded quote
    if (rest.startsWith("'")) {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue }
          j++
          break
        }
        j++
      }
      // Preserve a placeholder so adjacent tokens do not fuse together.
      out += "''"
      i = j
      continue
    }

    out += sql[i]
    i++
  }

  return out
}

/** Splits stripped SQL into statements on top-level semicolons. */
export function splitStatements(sql: string): string[] {
  return stripNonCode(sql)
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

/**
 * Scan a SQL string for destructive operations. Returns whether it is
 * destructive plus a human-readable reason per distinct rule hit.
 */
export function isDestructiveSql(sql: string): DestructiveScan {
  const reasons: string[] = []
  const seen = new Set<string>()

  const statements = splitStatements(sql)
  const readded = constraintsAddedIn(statements.join(';'))

  for (const statement of statements) {
    if (isRedefinition(statement, readded)) continue

    for (const rule of RULES) {
      if (seen.has(rule.reason)) continue
      if (rule.re.test(statement)) {
        seen.add(rule.reason)
        reasons.push(rule.reason)
      }
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
