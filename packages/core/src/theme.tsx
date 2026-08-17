import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  Component,
  SiteConfig,
  Template,
  ThemeAction,
  ThemeConfig,
  ThemeFooterConfig,
  ThemeHomeConfig,
  ThemeSlots,
} from './types'

function normalizeSiteUrl(domain: string): string {
  if (domain.startsWith('http://') || domain.startsWith('https://')) return domain
  return `https://${domain}`
}

function mergeAction(defaultValue?: ThemeAction, overrideValue?: ThemeAction): ThemeAction | undefined {
  if (!defaultValue && !overrideValue) return undefined
  const label = overrideValue?.label ?? defaultValue?.label
  if (!label) return undefined
  return {
    label,
    ...defaultValue,
    ...overrideValue,
  }
}

function mergeHomeConfig(defaults?: ThemeHomeConfig, overrides?: ThemeHomeConfig): ThemeHomeConfig | undefined {
  if (!defaults && !overrides) return undefined
  return {
    ...defaults,
    ...overrides,
    hero: {
      ...defaults?.hero,
      ...overrides?.hero,
      primaryAction: mergeAction(defaults?.hero?.primaryAction, overrides?.hero?.primaryAction),
      secondaryAction: mergeAction(defaults?.hero?.secondaryAction, overrides?.hero?.secondaryAction),
      capabilities: overrides?.hero?.capabilities ?? defaults?.hero?.capabilities,
    },
    selectedWorkAction: mergeAction(defaults?.selectedWorkAction, overrides?.selectedWorkAction),
    selectedWorkItems: overrides?.selectedWorkItems ?? defaults?.selectedWorkItems,
    capabilitiesItems: overrides?.capabilitiesItems ?? defaults?.capabilitiesItems,
    ctaAction: mergeAction(defaults?.ctaAction, overrides?.ctaAction),
  }
}

function mergeFooterConfig(defaults?: ThemeFooterConfig, overrides?: ThemeFooterConfig): ThemeFooterConfig | undefined {
  if (!defaults && !overrides) return undefined
  return {
    ...defaults,
    ...overrides,
    contactEmail: overrides?.contactEmail ?? defaults?.contactEmail,
    contactBlurb: overrides?.contactBlurb ?? defaults?.contactBlurb,
    columns: overrides?.columns ?? defaults?.columns,
    socialLinks: overrides?.socialLinks ?? defaults?.socialLinks,
  }
}

export function mergeThemeConfig(...configs: Array<ThemeConfig | undefined>): ThemeConfig {
  return configs.reduce<ThemeConfig>((acc, config) => {
    if (!config) return acc
    return {
      ...acc,
      ...config,
      brand: {
        ...acc.brand,
        ...config.brand,
      },
      navLinks: config.navLinks ?? acc.navLinks,
      navCta: mergeAction(acc.navCta, config.navCta),
      footer: mergeFooterConfig(acc.footer, config.footer),
      home: mergeHomeConfig(acc.home, config.home),
    }
  }, {})
}

function deriveThemeConfigFromSite(site: SiteConfig): ThemeConfig {
  const socialLinks = site.social
    ? Object.entries(site.social).map(([label, href]) => ({ label, href }))
    : undefined

  return {
    siteName: site.name,
    siteUrl: normalizeSiteUrl(site.domain),
    brand: {
      name: site.name,
      homePath: '/',
    },
    footer: {
      contactEmail: site.contactEmail,
      columns: socialLinks && socialLinks.length > 0
        ? [{ heading: 'Social', links: socialLinks }]
        : undefined,
    },
  }
}

function mergeThemeSlots(...slots: Array<ThemeSlots | undefined>): ThemeSlots {
  return slots.reduce<ThemeSlots>((acc, value) => ({ ...acc, ...(value ?? {}) }), {})
}

interface ThemeContextValue {
  config: ThemeConfig
  slots: ThemeSlots
}

const ThemeContext = createContext<ThemeContextValue>({
  config: {},
  slots: {},
})

export type ThemeResolver = () => Promise<ThemeConfig | undefined>

/**
 * Merges theme configuration from four layers, lowest precedence first:
 * derived from `SiteConfig` → template defaults → code-level `site.theme` →
 * whatever plugins resolve at runtime (`Plugin.resolveTheme`, e.g. the site
 * plugin's published settings row).
 *
 * The runtime layer wins because it is the one an editor controls from the
 * admin; code-level values are the fallback for a fresh install. Before this
 * layer existed the site plugin published settings nobody read.
 *
 * Resolvers run once after mount. Until they settle the static merge renders,
 * so a slow or failing fetch degrades to the code defaults rather than a blank
 * page; a rejected resolver is ignored (logged) and the others still apply.
 */
export function ThemeProvider({
  template,
  site,
  resolvers,
  children,
}: {
  template: Template
  site: SiteConfig
  resolvers?: readonly ThemeResolver[]
  children: ReactNode
}) {
  const [resolved, setResolved] = useState<ThemeConfig[]>([])

  useEffect(() => {
    if (!resolvers || resolvers.length === 0) return
    let cancelled = false
    Promise.all(
      resolvers.map((resolve) =>
        resolve().catch((error: unknown) => {
          if (typeof console !== 'undefined') console.warn('ThemeProvider: theme resolver failed', error)
          return undefined
        }),
      ),
    ).then((configs) => {
      if (cancelled) return
      setResolved(configs.filter((c): c is ThemeConfig => Boolean(c)))
    })
    return () => {
      cancelled = true
    }
  }, [resolvers])

  const value = useMemo<ThemeContextValue>(() => ({
    config: mergeThemeConfig(
      deriveThemeConfigFromSite(site),
      template.theme?.defaults,
      site.theme,
      ...resolved,
    ),
    slots: mergeThemeSlots(template.theme?.slots, site.themeSlots),
  }), [site, template, resolved])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeConfig(): ThemeConfig {
  return useContext(ThemeContext).config
}

export function useThemeSlots(): ThemeSlots {
  return useContext(ThemeContext).slots
}

export function useThemeSlot(slotId: string): Component | null {
  return useThemeSlots()[slotId] ?? null
}

export function ThemeSlot({
  slotId,
  fallback: Fallback,
}: {
  slotId: string
  fallback?: Component
}) {
  const SlotComponent = useThemeSlot(slotId) ?? Fallback
  if (!SlotComponent) return null
  return <SlotComponent />
}
