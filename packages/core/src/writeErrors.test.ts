import { describe, expect, it } from 'vitest'
import { describeSilentDenial, describeWriteError, isPermissionDenied } from './writeErrors'

describe('isPermissionDenied', () => {
  it('recognises the Postgres insufficient-privilege code', () => {
    expect(isPermissionDenied({ code: '42501', message: 'nope' })).toBe(true)
  })

  it('recognises the RLS message even without a code', () => {
    expect(
      isPermissionDenied({
        message: 'new row violates row-level security policy for table "pages_entries"',
      }),
    ).toBe(true)
  })

  it('does not treat ordinary failures as denials', () => {
    expect(isPermissionDenied({ code: '23505', message: 'duplicate key value' })).toBe(false)
    expect(isPermissionDenied(new Error('Network request failed'))).toBe(false)
    expect(isPermissionDenied(null)).toBe(false)
    expect(isPermissionDenied('a string')).toBe(false)
  })
})

describe('describeWriteError', () => {
  it('names the entity and the missing capability on a denial', () => {
    const message = describeWriteError(
      { code: '42501', message: 'new row violates row-level security policy' },
      'page',
      'pages.write',
    )

    expect(message).toContain('page')
    expect(message).toContain('pages.write')
    // The raw Postgres wording is unhelpful to an editor; it must not leak.
    expect(message).not.toContain('row-level security')
  })

  it('omits the capability clause when none is given', () => {
    const message = describeWriteError({ code: '42501' }, 'project')
    expect(message).toContain('project')
    expect(message).not.toContain('capability')
  })

  it('passes a non-permission error through unchanged', () => {
    expect(describeWriteError(new Error('Slug is required.'), 'page', 'pages.write')).toBe(
      'Slug is required.',
    )
    expect(describeWriteError({ message: 'duplicate key value' }, 'page')).toBe(
      'duplicate key value',
    )
  })

  it('falls back when the error carries nothing useful', () => {
    expect(describeWriteError({}, 'page')).toBe('Failed to save page.')
    expect(describeWriteError(undefined, 'site settings')).toBe('Failed to save site settings.')
  })
})

describe('describeSilentDenial', () => {
  it('explains the zero-rows case', () => {
    // An UPDATE rejected by a USING clause returns success with no rows, so the
    // UI would otherwise report a save that never happened.
    const message = describeSilentDenial('site settings', 'site.write')
    expect(message).toContain('not saved')
    expect(message).toContain('site.write')
  })
})
