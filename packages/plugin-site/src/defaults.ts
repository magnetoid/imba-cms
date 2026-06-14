import type { ThemeConfig } from '@imba/core'
import { PRIMARY_SITE_SETTINGS_SLUG } from './types'
import type { SiteSettingsContent, SiteSettingsRecord } from './types'

export const DEFAULT_SITE_SETTINGS_CONTENT: SiteSettingsContent = {
  brand: {
    name: 'MT',
    accent: 'Digital Systems',
    homePath: '/',
  },
  navLinks: [
    { label: 'About', to: '/about' },
    { label: 'Services', to: '/services' },
    { label: 'Projects', to: '/projects' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
  ],
  navCta: {
    label: 'Get in touch',
    to: '/contact',
  },
  footer: {
    contactEmail: 'marko.tiosavljevic@gmail.com',
    contactBlurb: 'Direct contact stays live while deeper CMS-managed enquiry flows are rebuilt cleanly.',
    copyright: 'Marko Tiosavljevic',
    platformNote: 'Preserved public UI, rebuilt onto the new IMBA CMS architecture in layers.',
    navLinks: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Services', to: '/services' },
      { label: 'Projects', to: '/projects' },
      { label: 'Blog', to: '/blog' },
      { label: 'Contact', to: '/contact' },
    ],
    socialLinks: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/mtiosavljevic' },
      { label: 'GitHub', href: 'https://github.com/magnetoid' },
    ],
  },
}

export const DEFAULT_SITE_SETTINGS_RECORD: SiteSettingsRecord = {
  id: `default-${PRIMARY_SITE_SETTINGS_SLUG}`,
  slug: PRIMARY_SITE_SETTINGS_SLUG,
  title: 'Public Site',
  status: 'published',
  content: DEFAULT_SITE_SETTINGS_CONTENT,
}

export function buildDefaultSiteSettingsRecord(): SiteSettingsRecord {
  return {
    ...DEFAULT_SITE_SETTINGS_RECORD,
    content: {
      ...DEFAULT_SITE_SETTINGS_RECORD.content,
      brand: { ...DEFAULT_SITE_SETTINGS_RECORD.content.brand },
      navLinks: DEFAULT_SITE_SETTINGS_RECORD.content.navLinks.map((link) => ({ ...link })),
      navCta: DEFAULT_SITE_SETTINGS_RECORD.content.navCta ? { ...DEFAULT_SITE_SETTINGS_RECORD.content.navCta } : undefined,
      footer: {
        ...DEFAULT_SITE_SETTINGS_RECORD.content.footer,
        navLinks: DEFAULT_SITE_SETTINGS_RECORD.content.footer.navLinks.map((link) => ({ ...link })),
        socialLinks: DEFAULT_SITE_SETTINGS_RECORD.content.footer.socialLinks.map((link) => ({ ...link })),
      },
    },
  }
}

export function buildSiteThemeConfig(content: SiteSettingsContent): ThemeConfig {
  return {
    brand: {
      name: content.brand.name,
      accent: content.brand.accent,
      homePath: content.brand.homePath,
    },
    navLinks: content.navLinks,
    navCta: content.navCta,
    footer: {
      contactEmail: content.footer.contactEmail,
      contactBlurb: content.footer.contactBlurb,
      copyright: content.footer.copyright,
      platformNote: content.footer.platformNote,
      columns: [
        {
          heading: 'Navigation',
          links: content.footer.navLinks,
        },
      ],
      socialLinks: content.footer.socialLinks,
    },
  }
}
