import { z } from 'zod'

/**
 * Boot-time validation of the object handed to `createCMS` / `createAdminApp` /
 * `createPublicApp`.
 *
 * Previously nothing validated this. A missing `VITE_SUPABASE_URL` or anon key
 * silently became `<origin>/supabase` and the literal string `'placeholder'`,
 * so a misconfigured deploy looked healthy until the first query came back 401
 * — far from the actual mistake. Failing at boot points straight at it.
 *
 * Only the *data* parts are schema-checked. Plugins and templates carry React
 * components and functions; `validatePlugins` and `buildRegistry` already cover
 * their structure, so this checks just enough to produce a good error message.
 */

const localeSchema = z.string().trim().min(1, 'locale must not be empty')

export const siteConfigSchema = z.object({
  name: z.string().trim().min(1, 'site.name is required'),
  domain: z.string().trim().min(1, 'site.domain is required'),
  defaultLocale: localeSchema,
  locales: z.array(localeSchema).min(1, 'site.locales must list at least one locale'),
  logoUrl: z.string().optional(),
  social: z.record(z.string()).optional(),
  contactEmail: z.string().optional(),
  theme: z.unknown().optional(),
  themeSlots: z.unknown().optional(),
}).superRefine((site, ctx) => {
  if (!site.locales.includes(site.defaultLocale)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultLocale'],
      message:
        `site.defaultLocale "${site.defaultLocale}" is not in site.locales ` +
        `[${site.locales.join(', ')}]`,
    })
  }
})

export const supabaseConfigSchema = z.object({
  url: z.string().trim().optional(),
  anonKey: z.string().trim().min(1, 'supabase.anonKey is required'),
  /**
   * Opt in to serving Supabase from `<origin>/supabase` (a same-origin reverse
   * proxy) instead of an absolute URL. This used to happen implicitly whenever
   * the URL was missing, which turned a configuration error into a runtime one.
   */
  allowOriginProxy: z.boolean().optional(),
}).superRefine((supabase, ctx) => {
  const url = supabase.url
  const unusable = !url || url.includes('placeholder') || url.includes('undefined')

  if (unusable && !supabase.allowOriginProxy) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['url'],
      message:
        'supabase.url is required. Set VITE_SUPABASE_URL (or the runtime-config ' +
        'equivalent), or set supabase.allowOriginProxy to serve Supabase from ' +
        '<origin>/supabase behind a reverse proxy.',
    })
    return
  }

  if (!unusable) {
    try {
      new URL(url!)
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: `supabase.url "${url}" is not a valid absolute URL.`,
      })
    }
  }
})

const pluginShapeSchema = z.object({
  name: z.string().trim().min(1, 'each plugin needs a name'),
  version: z.string().trim().min(1, 'each plugin needs a version'),
})

export const cmsConfigSchema = z.object({
  // May be empty: a template-only public app is legitimate. Structure of the
  // plugin graph itself is `validatePlugins`' job, not this schema's.
  plugins: z.array(pluginShapeSchema.passthrough()),
  site: siteConfigSchema,
  supabase: supabaseConfigSchema,
  template: z.unknown().optional(),
})

export class CmsConfigError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(
      `Invalid CMS configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n` +
        'Fix the configuration passed to createCMS/createAdminApp/createPublicApp.',
    )
    this.name = 'CmsConfigError'
    this.issues = issues
  }
}

/**
 * Throws `CmsConfigError` listing every problem at once, rather than failing on
 * the first one — a misconfigured deploy usually has more than one.
 */
export function assertValidCmsConfig(config: unknown): void {
  const result = cmsConfigSchema.safeParse(config)
  if (result.success) return

  const issues = result.error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })

  throw new CmsConfigError(issues)
}
