import type { ThemeConfig } from '@imba/core'

/**
 * The template's built-in copy, expressed as theme defaults.
 *
 * These used to be constants inside Nav.tsx and Footer.tsx, which meant the
 * site plugin's published brand/nav/footer settings had no effect on this
 * template. Now they are the lowest layer under `ThemeProvider`, and whatever
 * the CMS publishes overrides them field by field.
 */
export const CINEMA_THEME_DEFAULTS: ThemeConfig = {
  brand: { name: 'Imba', accent: 'Production', homePath: '/' },
  navLinks: [
    { label: 'Work', to: '/work' },
    { label: 'Services', to: '/services' },
    { label: 'Journal', to: '/blog' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
  navCta: { label: 'Start a project', to: '/contact' },
  footer: {
    ctaEyebrow: 'Get in touch',
    ctaTitle: 'Let’s make something cinematic.',
    contactEmail: 'hello@imbaproduction.com',
    columns: [
      {
        heading: 'Studio',
        links: [
          { label: 'Work', to: '/work' },
          { label: 'Services', to: '/services' },
          { label: 'Journal', to: '/blog' },
          { label: 'About', to: '/about' },
          { label: 'Contact', to: '/contact' },
        ],
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Privacy', to: '/privacy' },
          { label: 'Terms', to: '/terms' },
          { label: 'Admin', to: '/admin' },
        ],
      },
    ],
    socialLinks: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
      { label: 'Vimeo', href: 'https://vimeo.com' },
      { label: 'YouTube', href: 'https://youtube.com' },
    ],
    copyright: '© 2026 Imba Production',
    platformNote: 'Built on IMBA-CMS',
  },
}
