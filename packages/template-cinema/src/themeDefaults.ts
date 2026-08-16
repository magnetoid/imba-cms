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
  home: {
    hero: {
      eyebrow: 'Cinematic production · worldwide',
      title: 'Films that move people.',
      lead: 'We are a film and motion studio making brand films, commercials and documentary for companies that want their story told with craft.',
      primaryAction: { label: 'View work', to: '/work' },
      secondaryAction: { label: 'Start a project', to: '/contact' },
      capabilities: ['Brand films', 'Commercials', 'Documentary', 'Post', 'Motion'],
    },
    selectedWorkEyebrow: 'Selected work',
    selectedWorkTitle: 'A reel of recent films.',
    selectedWorkAction: { label: 'All work →', to: '/work' },
    selectedWorkItems: [
      { index: '01', title: 'Atlas', category: 'Brand film', span: 'lg:col-span-7', ratio: 'aspect-[16/10]' },
      { index: '02', title: 'Northwind', category: 'Commercial', span: 'lg:col-span-5', ratio: 'aspect-[4/5]' },
      { index: '03', title: 'Lumen', category: 'Documentary', span: 'lg:col-span-5', ratio: 'aspect-[4/5]' },
      { index: '04', title: 'Cassette', category: 'Music video', span: 'lg:col-span-7', ratio: 'aspect-[16/10]' },
      { index: '05', title: 'Field Notes', category: 'Series', span: 'lg:col-span-6', ratio: 'aspect-[3/2]' },
      { index: '06', title: 'Halcyon', category: 'Motion', span: 'lg:col-span-6', ratio: 'aspect-[3/2]' },
    ],
    statementEyebrow: 'Our belief',
    statementText: 'A film should feel inevitable — like it could only have been made one way.',
    statementAccentText: 'We obsess over the frame, the cut and the silence between them.',
    capabilitiesEyebrow: 'Capabilities',
    capabilitiesTitle: 'End to end, from first idea to final frame.',
    capabilitiesItems: [
      { no: '01', title: 'Brand films', body: 'Story-led hero films that carry a brand across a campaign and a year.' },
      { no: '02', title: 'Commercials', body: 'Broadcast and social spots built to perform — sharp, fast, repeatable.' },
      { no: '03', title: 'Documentary', body: 'Long-form and short docs with real people, real places, real weight.' },
      { no: '04', title: 'Post & motion', body: 'Edit, colour, sound and motion design finished to a cinema standard.' },
    ],
    ctaEyebrow: 'Next project',
    ctaTitle: 'Let’s talk.',
    ctaAction: { label: 'Start a project', to: '/contact' },
  },
}
