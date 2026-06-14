import { z } from 'zod'

export const PROJECT_STATUS = ['draft', 'published'] as const
export type ProjectStatus = (typeof PROJECT_STATUS)[number]

const statSchema = z.object({
  num: z.string().min(1),
  label: z.string().min(1),
})

const problemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

const titledBodySchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

const outcomeSchema = z.object({
  metric: z.string().min(1),
  label: z.string().min(1),
})

const quoteSchema = z.object({
  text: z.string().min(1),
  attribution: z.string().min(1),
})

export const projectContentSchema = z.object({
  role: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  stats: z.array(statSchema).min(1),
  problem: problemSchema,
  approach: z.array(titledBodySchema).min(1),
  features: z.array(
    z.object({
      title: z.string().min(1),
      desc: z.string().min(1),
    }),
  ).min(1),
  outcomes: z.array(outcomeSchema).min(1),
  lessons: z.array(z.string().min(1)).min(1),
  quote: quoteSchema.optional(),
})

export type ProjectContent = z.infer<typeof projectContentSchema>

export interface ProjectRecord {
  id: string
  slug: string
  name: string
  url: string
  year: string
  category: string
  tagline: string
  hero: string
  summary: string
  accent: string
  featured: boolean
  sortOrder: number
  status: ProjectStatus
  seoTitle: string
  seoDescription: string
  content: ProjectContent
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

export interface ProjectSummary {
  slug: string
  name: string
  category: string
  year: string
  accent: string
  tagline: string
  featured: boolean
  sortOrder: number
  status: ProjectStatus
  updatedAt?: string
}

export function parseProjectContent(value: unknown): ProjectContent {
  return projectContentSchema.parse(value)
}

export function emptyProjectContent(): ProjectContent {
  return {
    role: '',
    stack: [],
    stats: [{ num: '', label: '' }],
    problem: { title: '', body: '' },
    approach: [{ title: '', body: '' }],
    features: [{ title: '', desc: '' }],
    outcomes: [{ metric: '', label: '' }],
    lessons: [''],
  }
}
