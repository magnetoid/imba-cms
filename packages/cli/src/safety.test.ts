import { describe, it, expect } from 'vitest'
import { isDestructiveSql, assertAdditive } from './safety.js'

describe('isDestructiveSql', () => {
  it('flags DROP TABLE', () => {
    const r = isDestructiveSql('DROP TABLE users;')
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('DROP TABLE')
  })

  it('flags DROP COLUMN', () => {
    const r = isDestructiveSql('ALTER TABLE posts DROP COLUMN body;')
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('DROP COLUMN')
  })

  it('flags DELETE FROM', () => {
    const r = isDestructiveSql('DELETE FROM sessions WHERE expired;')
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('DELETE FROM')
  })

  it('flags TRUNCATE', () => {
    const r = isDestructiveSql('TRUNCATE audit_log;')
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('TRUNCATE')
  })

  it('flags ALTER TABLE ... DROP CONSTRAINT', () => {
    const r = isDestructiveSql('ALTER TABLE posts DROP CONSTRAINT posts_pkey;')
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('ALTER TABLE ... DROP CONSTRAINT')
  })

  it('does not flag a constraint dropped and re-added in the same migration', () => {
    // Idempotent redefinition, the same shape as `drop policy` + `create policy`.
    const r = isDestructiveSql(`
      ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
      ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('a','b'));
    `)
    expect(r.destructive).toBe(false)
  })

  it('still flags a constraint dropped without being re-added', () => {
    const r = isDestructiveSql('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;')
    expect(r.destructive).toBe(true)
  })

  it('does not flag enable-RLS paired with a later drop policy', () => {
    // The exact false positive that refused 7 of 12 shipped migrations: the old
    // whole-file regex spanned from ALTER TABLE to an unrelated DROP.
    const r = isDestructiveSql(`
      ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS posts_read ON posts;
      CREATE POLICY posts_read ON posts FOR SELECT USING (true);
    `)
    expect(r.destructive).toBe(false)
  })

  it('ignores keywords inside a dollar-quoted function body', () => {
    const r = isDestructiveSql(`
      CREATE OR REPLACE FUNCTION note() RETURNS text
      LANGUAGE sql AS $$ SELECT 'drop table posts; truncate posts' $$;
    `)
    expect(r.destructive).toBe(false)
  })

  it('ignores keywords inside a block comment', () => {
    const r = isDestructiveSql('/* drop table posts */ CREATE TABLE posts (id uuid);')
    expect(r.destructive).toBe(false)
  })

  it('does not let a string literal hide a real statement', () => {
    // A `--` inside a string used to swallow the rest of the line.
    const r = isDestructiveSql("INSERT INTO t VALUES ('-- x'); DROP TABLE posts;")
    expect(r.destructive).toBe(true)
    expect(r.reasons).toContain('DROP TABLE')
  })

  it('flags DROP SCHEMA and DROP DATABASE', () => {
    expect(isDestructiveSql('DROP SCHEMA public CASCADE;').destructive).toBe(true)
    expect(isDestructiveSql('DROP DATABASE app;').destructive).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isDestructiveSql('drop table x;').destructive).toBe(true)
    expect(isDestructiveSql('DeLeTe FrOm x;').destructive).toBe(true)
  })

  it('does NOT flag additive CREATE TABLE', () => {
    const r = isDestructiveSql('CREATE TABLE widgets (id uuid primary key);')
    expect(r.destructive).toBe(false)
    expect(r.reasons).toEqual([])
  })

  it('does NOT flag additive ADD COLUMN', () => {
    const r = isDestructiveSql('ALTER TABLE posts ADD COLUMN subtitle text;')
    expect(r.destructive).toBe(false)
  })

  it('ignores destructive keywords inside a line comment', () => {
    const sql = `-- DROP TABLE users; (we used to do this)
CREATE TABLE users (id uuid primary key);`
    const r = isDestructiveSql(sql)
    expect(r.destructive).toBe(false)
  })

  it('still flags destructive SQL on a line with a trailing comment', () => {
    const r = isDestructiveSql('DROP TABLE users; -- cleanup')
    expect(r.destructive).toBe(true)
  })
})

describe('assertAdditive', () => {
  const additive = [
    { id: 'core.V001', sql: 'CREATE TABLE a (id uuid);' },
    { id: 'blog.V001', sql: 'ALTER TABLE posts ADD COLUMN slug text;' },
  ]
  const withDestructive = [
    ...additive,
    { id: 'blog.V002', sql: 'DROP TABLE posts;' },
  ]

  it('returns empty list and does not throw for additive-only', () => {
    expect(assertAdditive(additive)).toEqual([])
  })

  it('throws when destructive and not forced, naming the migration', () => {
    expect(() => assertAdditive(withDestructive)).toThrowError(/blog\.V002/)
  })

  it('returns the destructive list (does not throw) when forced', () => {
    const result = assertAdditive(withDestructive, { force: true })
    expect(result).toEqual([{ id: 'blog.V002', reasons: ['DROP TABLE'] }])
  })

  it('reports all reasons for a multi-destructive migration', () => {
    const result = assertAdditive(
      [{ id: 'x.V001', sql: 'DROP TABLE a; TRUNCATE b;' }],
      { force: true },
    )
    expect(result[0].reasons).toEqual(expect.arrayContaining(['DROP TABLE', 'TRUNCATE']))
  })
})
