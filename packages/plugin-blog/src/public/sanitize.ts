/**
 * Sanitizer for rendered post bodies.
 *
 * Post bodies are authored as markdown and run through `marked`, whose output is
 * raw HTML that we hand to `dangerouslySetInnerHTML` on the PUBLIC site — which
 * shares an origin with `/admin`. Anything that survives here runs with the
 * reader's session, so this is a real trust boundary, not defence in depth.
 *
 * This replaced a hand-rolled denylist (strip `script/style/iframe/object/embed`,
 * drop `on*` attributes, drop `javascript:` URLs). Denylists lose: that one let
 * through `<base href>` hijacking, `data:` URLs, and scheme strings obfuscated
 * with leading control characters (`"javascript:"` fails a `/^javascript:/`
 * test after `.trim()`, but browsers strip the control byte and execute it).
 * It was also vulnerable to the mutation-XSS class that the parse-then-serialize
 * round trip creates. We use an allowlist via DOMPurify instead.
 */
import DOMPurify from 'dompurify'

/** Every element `marked` can emit from markdown, and nothing else. */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'del', 's', 'sup', 'sub',
  'a', 'img',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'align']

/**
 * `marked` never emits these, so allowing them could only come from raw HTML
 * embedded in a post body. `<base>` rewrites every relative URL on the page and
 * `<form>` enables credential-harvesting overlays; both are listed explicitly
 * because neither is an obvious "script-like" tag.
 */
const FORBID_TAGS = ['style', 'base', 'form', 'input', 'button', 'textarea', 'select', 'noscript']

export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    // Reject `javascript:`, `data:`, `vbscript:` and friends. DOMPurify handles
    // the control-character and entity obfuscations that a regex test misses.
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|ftp):|^[#/](?!\/)|^[^a-z]*[?#]/i,
    // Defeats the `<svg><style>` / `<math>` mutation-XSS families outright.
    USE_PROFILES: { html: true },
    RETURN_TRUSTED_TYPE: false,
  })
}
