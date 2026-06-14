import { z } from 'zod'

export const PRIMARY_SITE_SETTINGS_SLUG = 'primary' as const

export const SITE_SETTINGS_STATUS = ['draft', 'published'] as const
export type SiteSettingsStatus = (typeof SITE_SETTINGS_STATUS)[number]

const routeLinkSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
}).refine((value) => Boolean(value.to || value.href), {
  message: 'Each link needs either "to" or "href".',
})

const actionSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
}).refine((value) => Boolean(value.to || value.href), {
  message: 'Each action needs either "to" or "href".',
})

const socialLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

const brandSchema = z.object({
  name: z.string().min(1),
  accent: z.string().min(1),
  homePath: z.string().min(1),
})

const footerSchema = z.object({
  contactEmail: z.string().email(),
  contactBlurb: z.string().min(1),
  copyright: z.string().min(1),
  platformNote: z.string().min(1),
  navLinks: z.array(routeLinkSchema).min(1),
  socialLinks: z.array(socialLinkSchema).min(1),
})

export const siteSettingsContentSchema = z.object({
  brand: brandSchema,
  navLinks: z.array(routeLinkSchema).min(1),
  navCta: actionSchema.optional(),
  footer: footerSchema,
})

export type SiteSettingsLink = z.infer<typeof routeLinkSchema>
export type SiteSettingsAction = z.infer<typeof actionSchema>
export type SiteSettingsSocialLink = z.infer<typeof socialLinkSchema>
export type SiteSettingsContent = z.infer<typeof siteSettingsContentSchema>

export interface SiteSettingsRecord {
  id: string
  slug: typeof PRIMARY_SITE_SETTINGS_SLUG
  title: string
  status: SiteSettingsStatus
  content: SiteSettingsContent
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

export function parseSiteSettingsContent(value: unknown): SiteSettingsContent {
  return siteSettingsContentSchema.parse(value)
}
