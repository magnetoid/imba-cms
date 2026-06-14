import { z } from 'zod'

export const CMS_PAGE_SLUGS = ['home', 'about', 'services', 'contact'] as const
export type CmsPageSlug = (typeof CMS_PAGE_SLUGS)[number]

export const CMS_PAGE_STATUS = ['draft', 'published'] as const
export type CmsPageStatus = (typeof CMS_PAGE_STATUS)[number]

const actionSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
})

const statSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

const expertiseItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
})

const simpleLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

const timelineItemSchema = z.object({
  period: z.string().min(1),
  label: z.string().min(1),
})

const serviceItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  deliverables: z.array(z.string().min(1)).default([]),
})

const processItemSchema = z.object({
  step: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
})

const contactProfileSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

export const homePageContentSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  primaryAction: actionSchema,
  secondaryAction: actionSchema,
  expertiseHeading: z.string().min(1),
  expertiseItems: z.array(expertiseItemSchema).min(1),
  postsHeading: z.string().min(1),
  postsActionLabel: z.string().min(1),
  aboutPanelEyebrow: z.string().min(1),
  aboutPanelTitle: z.string().min(1),
  aboutPanelLead: z.string().min(1),
  aboutPanelPrimaryAction: actionSchema,
  aboutPanelSecondaryAction: actionSchema,
})

export const aboutPageContentSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  primaryAction: actionSchema,
  secondaryAction: actionSchema,
  focusHeading: z.string().min(1),
  focusAreas: z.array(z.string().min(1)).min(1),
  statsHeading: z.string().min(1),
  stats: z.array(statSchema).min(1),
  linksHeading: z.string().min(1),
  links: z.array(simpleLinkSchema).min(1),
  timelineHeading: z.string().min(1),
  timeline: z.array(timelineItemSchema).min(1),
})

export const servicesPageContentSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  services: z.array(serviceItemSchema).min(1),
  processHeading: z.string().min(1),
  process: z.array(processItemSchema).min(1),
  ctaEyebrow: z.string().min(1),
  ctaTitle: z.string().min(1),
  ctaBody: z.string().min(1),
  ctaAction: actionSchema,
})

export const contactPageContentSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  email: z.string().email(),
  responseHeading: z.string().min(1),
  responseText: z.string().min(1),
  profilesHeading: z.string().min(1),
  profiles: z.array(contactProfileSchema).min(1),
  noteEyebrow: z.string().min(1),
  noteTitle: z.string().min(1),
  noteBody: z.string().min(1),
  notePrimaryAction: actionSchema,
  noteSecondaryAction: actionSchema,
})

export const cmsPageContentSchemas = {
  home: homePageContentSchema,
  about: aboutPageContentSchema,
  services: servicesPageContentSchema,
  contact: contactPageContentSchema,
} as const

export type HomePageContent = z.infer<typeof homePageContentSchema>
export type AboutPageContent = z.infer<typeof aboutPageContentSchema>
export type ServicesPageContent = z.infer<typeof servicesPageContentSchema>
export type ContactPageContent = z.infer<typeof contactPageContentSchema>

export interface CmsPageContentMap {
  home: HomePageContent
  about: AboutPageContent
  services: ServicesPageContent
  contact: ContactPageContent
}

export interface CmsPageRecord<TSlug extends CmsPageSlug = CmsPageSlug> {
  id: string
  slug: TSlug
  title: string
  status: CmsPageStatus
  seoTitle: string
  seoDescription: string
  content: CmsPageContentMap[TSlug]
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

export interface CmsPageSummary {
  slug: CmsPageSlug
  title: string
  status: CmsPageStatus
  updatedAt?: string
}

export function isCmsPageSlug(value: string): value is CmsPageSlug {
  return CMS_PAGE_SLUGS.includes(value as CmsPageSlug)
}

export function parseCmsPageContent<TSlug extends CmsPageSlug>(
  slug: TSlug,
  value: unknown,
): CmsPageContentMap[TSlug] {
  return cmsPageContentSchemas[slug].parse(value) as CmsPageContentMap[TSlug]
}
