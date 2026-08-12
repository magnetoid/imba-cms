import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Guard for operator-supplied outbound URLs (the GraphQL / MCP "test
 * connection" buttons).
 *
 * This process holds the Supabase service-role key and, in most deployments,
 * sits inside a private network next to the database and the cloud metadata
 * endpoint. An unrestricted fetch to an arbitrary URL is a server-side request
 * forgery primitive: a settings-manager could aim it at
 * `http://169.254.169.254/` and read the response status back through the
 * connection-test result.
 *
 * The checks are scheme allowlist + resolved-address filtering. DNS is resolved
 * here so that a hostname pointing at a private address is rejected too, not
 * just a literal private IP.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export class BlockedOutboundUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlockedOutboundUrlError'
  }
}

function parseIpv4(address: string): number[] | null {
  if (isIP(address) !== 4) return null
  return address.split('.').map(Number)
}

/** RFC1918, loopback, link-local (incl. cloud metadata), CGNAT, broadcast. */
export function isPrivateIpv4(address: string): boolean {
  const parts = parseIpv4(address)
  if (!parts) return false
  const [a, b] = parts as [number, number, number, number]

  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true

  return false
}

export function isPrivateIpv6(address: string): boolean {
  if (isIP(address) !== 6) return false
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '')

  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fe80')) return true // link-local
  if (/^f[cd]/.test(normalized)) return true // unique-local fc00::/7

  // IPv4-mapped (::ffff:169.254.169.254) must not bypass the IPv4 rules.
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIpv4(mapped[1]!)

  return false
}

export function isPrivateAddress(address: string): boolean {
  return isPrivateIpv4(address) || isPrivateIpv6(address)
}

export interface OutboundGuardOptions {
  /** Injected for tests; defaults to real DNS resolution. */
  resolve?: (hostname: string) => Promise<string[]>
  /** Escape hatch for deployments that genuinely target an internal endpoint. */
  allowPrivate?: boolean
}

async function defaultResolve(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true })
  return results.map((entry) => entry.address)
}

/**
 * Throws `BlockedOutboundUrlError` unless `rawUrl` is safe to fetch.
 * Returns the parsed URL on success.
 */
export async function assertOutboundUrlAllowed(
  rawUrl: string,
  options: OutboundGuardOptions = {},
): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new BlockedOutboundUrlError(`"${rawUrl}" is not a valid URL.`)
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new BlockedOutboundUrlError(
      `Refusing to request ${url.protocol}// — only http and https are allowed.`,
    )
  }

  if (options.allowPrivate) return url

  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  // A literal address needs no lookup, and must not get one: resolving it would
  // be a no-op that only widens the window for a TOCTOU rebind.
  if (isIP(hostname) !== 0) {
    if (isPrivateAddress(hostname)) {
      throw new BlockedOutboundUrlError(
        `Refusing to request a private address (${hostname}). Set IMBA_ALLOW_PRIVATE_OUTBOUND=1 if this is intended.`,
      )
    }
    return url
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new BlockedOutboundUrlError(
      'Refusing to request localhost. Set IMBA_ALLOW_PRIVATE_OUTBOUND=1 if this is intended.',
    )
  }

  let addresses: string[]
  try {
    addresses = await (options.resolve ?? defaultResolve)(hostname)
  } catch {
    throw new BlockedOutboundUrlError(`Could not resolve "${hostname}".`)
  }

  if (addresses.length === 0) {
    throw new BlockedOutboundUrlError(`"${hostname}" did not resolve to any address.`)
  }

  const blocked = addresses.filter(isPrivateAddress)
  if (blocked.length > 0) {
    throw new BlockedOutboundUrlError(
      `"${hostname}" resolves to a private address (${blocked.join(', ')}). ` +
        'Set IMBA_ALLOW_PRIVATE_OUTBOUND=1 if this is intended.',
    )
  }

  return url
}

export function allowPrivateOutbound(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.IMBA_ALLOW_PRIVATE_OUTBOUND === '1'
}
