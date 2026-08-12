import { describe, expect, it, vi } from 'vitest'
import {
  BlockedOutboundUrlError,
  allowPrivateOutbound,
  assertOutboundUrlAllowed,
  isPrivateAddress,
} from './outbound.js'

/** Never let a real lookup happen in these tests. */
const resolvePublic = vi.fn(async () => ['93.184.216.34'])

describe('isPrivateAddress', () => {
  it.each([
    '10.0.0.1',
    '127.0.0.1',
    '169.254.169.254', // cloud instance metadata
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '100.64.0.1', // CGNAT
    '0.0.0.0',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:169.254.169.254', // IPv4-mapped must not bypass the v4 rules
  ])('treats %s as private', (address) => {
    expect(isPrivateAddress(address)).toBe(true)
  })

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:2800:220:1::1'])(
    'treats %s as public',
    (address) => {
      expect(isPrivateAddress(address)).toBe(false)
    },
  )
})

describe('assertOutboundUrlAllowed', () => {
  it('allows a public https endpoint', async () => {
    const url = await assertOutboundUrlAllowed('https://api.example.com/graphql', {
      resolve: resolvePublic,
    })
    expect(url.hostname).toBe('api.example.com')
  })

  it('rejects the cloud metadata endpoint', async () => {
    await expect(
      assertOutboundUrlAllowed('http://169.254.169.254/latest/meta-data/', { resolve: resolvePublic }),
    ).rejects.toBeInstanceOf(BlockedOutboundUrlError)
  })

  it('rejects localhost', async () => {
    await expect(
      assertOutboundUrlAllowed('http://localhost:5432/', { resolve: resolvePublic }),
    ).rejects.toThrow(/localhost/)
  })

  it('rejects a hostname that resolves to a private address', async () => {
    // The DNS-rebinding shape: a public-looking name pointing inward.
    await expect(
      assertOutboundUrlAllowed('https://internal.example.com/', {
        resolve: async () => ['10.1.2.3'],
      }),
    ).rejects.toThrow(/resolves to a private address/)
  })

  it('rejects non-http schemes', async () => {
    for (const url of ['file:///etc/passwd', 'gopher://x/', 'ftp://x/']) {
      await expect(assertOutboundUrlAllowed(url, { resolve: resolvePublic })).rejects.toThrow(
        /only http and https/,
      )
    }
  })

  it('rejects a malformed url', async () => {
    await expect(assertOutboundUrlAllowed('not a url', { resolve: resolvePublic })).rejects.toThrow(
      /not a valid URL/,
    )
  })

  it('rejects a hostname that fails to resolve', async () => {
    await expect(
      assertOutboundUrlAllowed('https://nope.example/', {
        resolve: async () => {
          throw new Error('ENOTFOUND')
        },
      }),
    ).rejects.toThrow(/Could not resolve/)
  })

  it('does not resolve literal addresses', async () => {
    const resolve = vi.fn(async () => ['10.0.0.1'])
    await assertOutboundUrlAllowed('https://93.184.216.34/', { resolve })
    expect(resolve).not.toHaveBeenCalled()
  })

  it('honours the explicit private-network escape hatch', async () => {
    const url = await assertOutboundUrlAllowed('http://10.0.0.5:8080/mcp', { allowPrivate: true })
    expect(url.hostname).toBe('10.0.0.5')
  })
})

describe('allowPrivateOutbound', () => {
  it('is off unless explicitly enabled', () => {
    expect(allowPrivateOutbound({})).toBe(false)
    expect(allowPrivateOutbound({ IMBA_ALLOW_PRIVATE_OUTBOUND: 'true' })).toBe(false)
    expect(allowPrivateOutbound({ IMBA_ALLOW_PRIVATE_OUTBOUND: '1' })).toBe(true)
  })
})
