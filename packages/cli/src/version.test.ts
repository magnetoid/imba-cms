import { describe, it, expect } from 'vitest'
import { parseTag, compareVersions, latestTag, tagsBetween } from './version.js'

describe('parseTag', () => {
  it('parses plain v-prefixed semver', () => {
    expect(parseTag('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  it('parses bare semver without v prefix', () => {
    expect(parseTag('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
  })

  it('parses upstream-style tags ending in -vX.Y.Z', () => {
    expect(parseTag('imba-cms-foundation-v0.1.0')).toEqual({ major: 0, minor: 1, patch: 0 })
  })

  it('picks the last semver token when several appear', () => {
    expect(parseTag('release-1.0.0-final-v2.3.4')).toEqual({ major: 2, minor: 3, patch: 4 })
  })

  it('returns null for junk with no semver', () => {
    expect(parseTag('not-a-version')).toBeNull()
    expect(parseTag('v1.2')).toBeNull()
    expect(parseTag('')).toBeNull()
  })
})

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions({ major: 1, minor: 0, patch: 0 }, { major: 2, minor: 0, patch: 0 })).toBe(-1)
    expect(compareVersions({ major: 1, minor: 2, patch: 0 }, { major: 1, minor: 1, patch: 9 })).toBe(1)
    expect(compareVersions({ major: 1, minor: 1, patch: 1 }, { major: 1, minor: 1, patch: 2 })).toBe(-1)
  })

  it('returns 0 for equal versions', () => {
    expect(compareVersions({ major: 3, minor: 4, patch: 5 }, { major: 3, minor: 4, patch: 5 })).toBe(0)
  })
})

describe('latestTag', () => {
  it('picks the highest parseable version', () => {
    expect(latestTag(['v1.0.0', 'v1.2.0', 'v1.1.5'])).toBe('v1.2.0')
  })

  it('ignores unparseable tags', () => {
    expect(latestTag(['nightly', 'v0.9.0', 'latest', 'v1.0.0'])).toBe('v1.0.0')
  })

  it('handles mixed naming conventions', () => {
    expect(latestTag(['imba-cms-foundation-v0.1.0', 'v0.2.0'])).toBe('v0.2.0')
  })

  it('returns null when nothing parses', () => {
    expect(latestTag(['main', 'HEAD', 'latest'])).toBeNull()
    expect(latestTag([])).toBeNull()
  })
})

describe('tagsBetween', () => {
  const tags = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v1.3.0', 'junk']

  it('excludes the current tag (exclusive low bound)', () => {
    expect(tagsBetween(tags, 'v1.0.0', 'v1.3.0')).toEqual(['v1.1.0', 'v1.2.0', 'v1.3.0'])
  })

  it('includes the target tag (inclusive high bound)', () => {
    expect(tagsBetween(tags, 'v1.1.0', 'v1.2.0')).toEqual(['v1.2.0'])
  })

  it('returns sorted ascending', () => {
    const shuffled = ['v1.3.0', 'v1.1.0', 'v1.2.0']
    expect(tagsBetween(shuffled, 'v1.0.0', 'v1.3.0')).toEqual(['v1.1.0', 'v1.2.0', 'v1.3.0'])
  })

  it('ignores unparseable tags within the range', () => {
    expect(tagsBetween(tags, 'v1.0.0', 'v1.2.0')).toEqual(['v1.1.0', 'v1.2.0'])
  })

  it('returns empty when current or target is unparseable', () => {
    expect(tagsBetween(tags, 'junk', 'v1.3.0')).toEqual([])
    expect(tagsBetween(tags, 'v1.0.0', 'junk')).toEqual([])
  })

  it('returns empty when nothing is strictly greater than current', () => {
    expect(tagsBetween(tags, 'v1.3.0', 'v1.3.0')).toEqual([])
  })
})
