/**
 * Semantic-version utilities for the git-tag update channel.
 *
 * Tags can take two shapes:
 *   - plain semver, optionally `v`-prefixed: `1.2.3`, `v1.2.3`
 *   - upstream release tags ending in `-vX.Y.Z`: `imba-cms-foundation-v0.1.0`
 *
 * We always extract the LAST semver-looking token in the tag so the
 * upstream naming convention keeps working as it evolves.
 */

export interface ParsedVersion {
  major: number
  minor: number
  patch: number
}

// Matches a semver core (X.Y.Z) optionally preceded by `v`, anchored so it is
// the final meaningful token of the tag. The `g` flag lets us pick the last hit.
const SEMVER_RE = /v?(\d+)\.(\d+)\.(\d+)/g

/**
 * Parse a tag into its version components, or null if no semver is present.
 * Picks the LAST semver match in the string so prefixes like
 * `imba-cms-foundation-` don't interfere.
 */
export function parseTag(tag: string): ParsedVersion | null {
  if (typeof tag !== 'string') return null
  SEMVER_RE.lastIndex = 0
  let match: RegExpExecArray | null
  let last: RegExpExecArray | null = null
  while ((match = SEMVER_RE.exec(tag)) !== null) {
    last = match
  }
  if (!last) return null
  return {
    major: Number(last[1]),
    minor: Number(last[2]),
    patch: Number(last[3]),
  }
}

/**
 * Compare two parsed versions. Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1
  return 0
}

/**
 * Return the tag with the highest parseable version. Tags that don't parse are
 * ignored. Returns null when no tag parses.
 */
export function latestTag(tags: string[]): string | null {
  let best: string | null = null
  let bestParsed: ParsedVersion | null = null
  for (const tag of tags) {
    const parsed = parseTag(tag)
    if (!parsed) continue
    if (bestParsed === null || compareVersions(parsed, bestParsed) > 0) {
      best = tag
      bestParsed = parsed
    }
  }
  return best
}

/**
 * Return all parseable tags strictly greater than `current` and ≤ `target`,
 * sorted ascending by version. Unparseable tags are ignored. If `current` or
 * `target` cannot be parsed, returns an empty list (nothing can be reasoned
 * about safely).
 */
export function tagsBetween(tags: string[], current: string, target: string): string[] {
  const cur = parseTag(current)
  const tgt = parseTag(target)
  if (!cur || !tgt) return []

  const inRange = tags
    .map((tag) => ({ tag, parsed: parseTag(tag) }))
    .filter(
      (t): t is { tag: string; parsed: ParsedVersion } =>
        t.parsed !== null &&
        compareVersions(t.parsed, cur) > 0 &&
        compareVersions(t.parsed, tgt) <= 0,
    )

  inRange.sort((a, b) => compareVersions(a.parsed, b.parsed))
  return inRange.map((t) => t.tag)
}
