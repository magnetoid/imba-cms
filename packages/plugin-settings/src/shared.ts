import { z } from 'zod'

const timeoutSchema = z.number().int().min(1000).max(30000)
const authModeSchema = z.enum(['none', 'bearer', 'basic'])

function asOptionalTrimmed(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const settingsBaseSchema = z.object({
  enabled: z.boolean(),
  endpointUrl: z.string().url(),
  authMode: authModeSchema,
  token: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  timeoutMs: timeoutSchema,
})

const settingsBaseDefaults = {
  enabled: false,
  endpointUrl: '',
  authMode: 'none',
  token: '',
  username: '',
  password: '',
  timeoutMs: 5000,
} as const

export const graphqlSettingsSchema = settingsBaseSchema.extend({
  endpointUrl: z.string().url().or(z.literal('')),
}).superRefine((value, ctx) => {
  if (!value.enabled) return
  if (!value.endpointUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'GraphQL endpoint URL is required.', path: ['endpointUrl'] })
  }
  if (value.authMode === 'bearer' && !asOptionalTrimmed(value.token)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bearer token is required.', path: ['token'] })
  }
  if (value.authMode === 'basic' && !asOptionalTrimmed(value.username)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username is required.', path: ['username'] })
  }
  if (value.authMode === 'basic' && !asOptionalTrimmed(value.password)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is required.', path: ['password'] })
  }
})

export const mcpSettingsSchema = settingsBaseSchema.extend({
  endpointUrl: z.string().url().or(z.literal('')),
  transport: z.enum(['streamable-http', 'http']),
}).superRefine((value, ctx) => {
  if (!value.enabled) return
  if (!value.endpointUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCP server URL is required.', path: ['endpointUrl'] })
  }
  if (value.authMode === 'bearer' && !asOptionalTrimmed(value.token)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bearer token is required.', path: ['token'] })
  }
  if (value.authMode === 'basic' && !asOptionalTrimmed(value.username)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username is required.', path: ['username'] })
  }
  if (value.authMode === 'basic' && !asOptionalTrimmed(value.password)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is required.', path: ['password'] })
  }
})

export type GraphqlSettings = z.infer<typeof graphqlSettingsSchema>
export type McpSettings = z.infer<typeof mcpSettingsSchema>
export type AuthMode = z.infer<typeof authModeSchema>

export interface ConnectionTestResult {
  ok: boolean
  status?: number
  message: string
}

export const DEFAULT_GRAPHQL_SETTINGS: GraphqlSettings = {
  ...settingsBaseDefaults,
}

export const DEFAULT_MCP_SETTINGS: McpSettings = {
  ...settingsBaseDefaults,
  transport: 'streamable-http',
}
