/**
 * Site-wide copy and links for mtiosavljevic.com.
 *
 * Everything here is written into the template on purpose: the CMS session
 * will later move it behind plugin-site / plugin-pages so it becomes editable
 * from the admin. Until then this file is the single place to change it.
 *
 * Every figure below comes from Marko's own public Upwork profile or the
 * previous live site. Do not add client results that are not sourced.
 */

export const CONTACT_EMAIL = 'marko@mtiosavljevic.com'
export const UPWORK_URL = 'https://www.upwork.com/freelancers/~01ea5c8271b5e86e24'
export const GITHUB_URL = 'https://github.com/magnetoid'
export const LINKEDIN_URL = 'https://linkedin.com/in/mtiosavljevic'

export interface MenuLink {
  to: string
  label: string
  note: string
}

export interface Menu {
  id: 'build' | 'marketing'
  label: string
  links: MenuLink[]
}

/** The two menus. Build & Research is the lab; Marketing & Services is the shop. */
export const MENUS: Menu[] = [
  {
    id: 'build',
    label: 'Build & Research',
    links: [
      { to: '/research', label: 'Research', note: 'Three questions about AI that the work is organised around' },
      { to: '/systems', label: 'Systems & open source', note: 'Quorum, Janus, torsor-helper, Morpheus OS and more' },
      { to: '/projects', label: 'Case studies', note: 'Products built end to end, problem to outcome' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Services',
    links: [
      { to: '/services', label: 'Services', note: 'AI automation, e-commerce, ads and tracking, SEO, video' },
      { to: '/results', label: 'Client results', note: 'Who I have worked with and what the track record says' },
      { to: '/approach', label: 'How I work', note: 'What happens from the first call to the numbers moving' },
    ],
  },
]

export interface ProofStat {
  num: string
  label: string
}

/** Headline proof. Source: public Upwork profile (Top Rated Plus, 100% JSS). */
export const PROOF_STATS: ProofStat[] = [
  { num: '130+', label: 'businesses scaled, from first-time founders to established brands' },
  { num: '100%', label: 'Job Success Score on Upwork, Top Rated Plus' },
  { num: '15 yrs', label: 'on Upwork without a break, since 2011' },
  { num: '100+', label: 'online stores built and scaled' },
  { num: '$500K', label: 'a month: the largest ad budgets I have managed' },
]

/** Experience line used across pages. Source: previous live site. */
export const EXPERIENCE = {
  software: '38 years',
  marketing: '30 years',
  ai: '6 years',
}

/** Brands named on the public Upwork portfolio. Names only until results are added. */
export const CLIENT_NAMES = [
  'DotBooks',
  'Vitamin Energy',
  'Swiss Made Direct',
  'Irving Scott',
  'Rhodes Experience',
  'Montenegro Experience',
]

export const WHO_I_WORK_WITH = [
  {
    title: 'Founders who need to move fast',
    body: 'You have a product and not much time. I get the store, the tracking and the first profitable campaigns standing without you hiring five people.',
  },
  {
    title: 'Established brands ready for AI',
    body: 'You already sell. I find the manual work and the wasted spend, and replace them with automation and data you can trust.',
  },
  {
    title: 'Small businesses that want a senior operator',
    body: 'You get the person who does the work, with decades behind them, instead of a junior freelancer learning on your budget.',
  },
  {
    title: 'Agencies that need a reliable partner',
    body: 'For the projects that cross development, marketing and AI, where a specialist in only one of them gets stuck.',
  },
]
