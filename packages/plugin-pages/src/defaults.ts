import type { CmsPageContentMap, CmsPageRecord, CmsPageSlug } from './types'

export const DEFAULT_SITE_PAGES: CmsPageContentMap = {
  home: {
    eyebrow: 'Senior Digital Consultant · Full-Stack Developer · AI Specialist',
    title: 'Marko Tiosavljević',
    subtitle: '35+ years spanning graphic design, full-stack development, AI automation, and performance marketing. Founder of Imba Production and architect of multiple live SaaS products.',
    primaryAction: {
      label: 'Read the blog',
      to: '/blog',
    },
    secondaryAction: {
      label: 'About me',
      to: '/about',
    },
    expertiseHeading: 'Areas of expertise',
    expertiseItems: [
      {
        icon: '◈',
        title: 'AI & Automation',
        description: 'Claude API, MCP workflows, Gemini, Ollama local LLMs, Dify, and AI-native product development.',
      },
      {
        icon: '◉',
        title: 'Full-Stack Development',
        description: 'React, Vite, TypeScript, Node.js, PHP. From landing pages to complex SaaS platforms with Supabase and Docker.',
      },
      {
        icon: '▣',
        title: 'eCommerce Architecture',
        description: 'WooCommerce, Shopify, BigCommerce, Medusa v2, subscriptions, multivendor, and international commerce systems.',
      },
      {
        icon: '◬',
        title: 'Performance Marketing',
        description: 'Google Ads, Meta Ads, Amazon Ads, GA4, GTM, HubSpot, and data-driven growth systems for ambitious teams.',
      },
      {
        icon: '◫',
        title: 'DevOps & Cloud',
        description: 'Docker, Coolify, Hetzner VPS, Nginx, self-hosted Supabase, CrowdSec, and delivery pipelines.',
      },
      {
        icon: '▶',
        title: 'Brand & Graphic Design',
        description: 'Brand identity systems, Adobe Creative Suite, UI/UX, and design direction shaped by decades of hands-on work.',
      },
    ],
    postsHeading: 'Latest writing',
    postsActionLabel: 'All posts',
    aboutPanelEyebrow: '> marko_t --whoami',
    aboutPanelTitle: 'Three decades of building at the frontier.',
    aboutPanelLead: 'From early internet infrastructure to modern AI systems. I write about what I build, what I learn, and where technology is headed.',
    aboutPanelPrimaryAction: {
      label: 'Read my story',
      to: '/about',
    },
    aboutPanelSecondaryAction: {
      label: 'Work with me',
      to: '/services',
    },
  },
  about: {
    eyebrow: 'About',
    title: 'Marko Tiosavljević',
    role: 'Senior Digital Consultant · Full-Stack Developer · AI Specialist · Founder',
    paragraphs: [
      'Multi-disciplinary digital professional with 35+ years of hands-on experience spanning graphic design, brand identity, web and software development, performance marketing, video production, and AI automation.',
      'Started in print and brand design in the late 1990s, evolved through the full arc of the web from static HTML through CMS platforms, eCommerce, SaaS, and now AI-native product development.',
      'Founder of Imba Production and architect of multiple live SaaS products, with a proven record of scaling 130+ businesses across Europe and the US.',
      'Operates across the entire product lifecycle: brand identity and UI/UX, engineering, infrastructure, paid media, analytics, and go-to-market strategy.',
    ],
    primaryAction: {
      label: 'Get in touch',
      to: '/contact',
    },
    secondaryAction: {
      label: 'Work with me',
      to: '/services',
    },
    focusHeading: 'Core expertise',
    focusAreas: [
      'AI & Automation',
      'Full-Stack Development',
      'eCommerce Architecture',
      'Performance Marketing',
      'DevOps & Cloud',
      'Brand Identity Design',
      'SaaS Product Building',
      'Technical SEO',
    ],
    statsHeading: 'By the numbers',
    stats: [
      { value: '25+', label: 'Years experience' },
      { value: '130+', label: 'Businesses scaled' },
      { value: '10+', label: 'Live SaaS products' },
      { value: '100%', label: 'Upwork Job Success Score' },
    ],
    linksHeading: 'Find me online',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/markotiosavljevic' },
      { label: 'Imba Production', href: 'https://imbaproduction.com' },
      { label: 'GitHub', href: 'https://github.com/magnetoid' },
      { label: 'Upwork', href: 'https://upwork.com' },
    ],
    timelineHeading: '25-Year Career Timeline',
    timeline: [
      { period: '1999–2003', label: 'Graphic Designer — print, brand design, packaging, and pre-press.' },
      { period: '2003–2007', label: 'Web Designer / Developer — early websites, CMS work, and the founding of Imba Production.' },
      { period: '2007–2012', label: 'Digital Marketing Specialist — SEO, Google Ads, eCommerce, and video production.' },
      { period: '2012–2016', label: 'WordPress / WooCommerce Expert — custom themes at scale and 50+ client engagements.' },
      { period: '2016–2020', label: 'Full-Stack eCommerce Architect — Shopify, WooCommerce, brand systems, and eLearning.' },
      { period: '2020–2022', label: 'Cloud / DevOps & SaaS Pivot — Docker, Hetzner, Coolify, Supabase, and MVP delivery.' },
      { period: '2022–2024', label: 'SaaS Developer & AI Integrator — Claude, Gemini, Ollama, Dify, MCP, and product architecture.' },
      { period: 'Now', label: 'AI-Native Product Builder — multi-agent systems, vibe coding, and live SaaS platforms.' },
    ],
  },
  services: {
    eyebrow: 'Services',
    title: 'Work with me',
    intro: 'Focused consulting and delivery engagements across product strategy, software architecture, AI systems, and growth infrastructure.',
    services: [
      {
        icon: '◈',
        title: 'AI & Automation',
        description: 'Claude API, MCP workflows, Gemini, Ollama local LLMs, Dify, and multi-agent orchestration.',
        deliverables: ['Multi-agent system design', 'LLM integration', 'AI content pipelines', 'Dify / LobeChat deployment'],
      },
      {
        icon: '◉',
        title: 'Full-Stack Development',
        description: 'React, Vite, TypeScript, Node.js, PHP, Supabase, Docker, and SaaS platform delivery.',
        deliverables: ['SaaS MVP development', 'React / Next.js apps', 'Supabase & PostgreSQL', 'Docker & Coolify deployments'],
      },
      {
        icon: '▣',
        title: 'eCommerce Architecture',
        description: 'WooCommerce, Shopify, BigCommerce, Medusa v2, multivendor, subscriptions, and custom checkout logic.',
        deliverables: ['WooCommerce custom development', 'Shopify & BigCommerce', 'Multivendor platforms', 'Custom checkout plugins'],
      },
      {
        icon: '◬',
        title: 'Performance Marketing',
        description: 'Google Ads, Meta Ads, Amazon Ads, GA4, GTM, HubSpot, CRO, and attribution design.',
        deliverables: ['Paid campaign systems', 'GA4 & GTM setup', 'HubSpot CRM', 'Email automation'],
      },
      {
        icon: '◫',
        title: 'DevOps & Cloud',
        description: 'Hetzner VPS, Coolify, Docker Compose, self-hosted Supabase, Nginx, Plesk, and CI/CD.',
        deliverables: ['Hetzner VPS setup', 'Coolify & Docker Compose', 'Self-hosted Supabase', 'CI/CD pipelines'],
      },
      {
        icon: '▶',
        title: 'Brand Identity & Design',
        description: 'Logo systems, UI/UX, print, packaging, and design systems grounded in long-term brand work.',
        deliverables: ['Logo & brand identity', 'Print & packaging', 'UI/UX design', 'Brand guidelines'],
      },
    ],
    processHeading: 'How I work',
    process: [
      { step: '01', title: 'Discovery', description: 'We start with goals, stack, constraints, and delivery priorities.' },
      { step: '02', title: 'Strategy', description: 'I map the scope, architecture, timeline, and realistic delivery plan upfront.' },
      { step: '03', title: 'Build', description: 'Focused execution with regular updates and code that lives in your repo from day one.' },
      { step: '04', title: 'Ship & Hand Off', description: 'Documentation, knowledge transfer, and ongoing support where needed.' },
    ],
    ctaEyebrow: '> available for engagements',
    ctaTitle: 'Not sure what you need?',
    ctaBody: 'Let’s have a direct conversation about the problem, the stack, and the fastest path to a strong solution.',
    ctaAction: {
      label: 'Start a conversation',
      to: '/contact',
    },
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Get in touch',
    intro: 'Available for consulting, technical writing, speaking, and carefully chosen collaborations.',
    email: 'marko.tiosavljevic@gmail.com',
    responseHeading: 'Response time',
    responseText: 'I respond to enquiries within 24–48 hours, Monday to Friday.',
    profilesHeading: 'Profiles',
    profiles: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/mtiosavljevic' },
      { label: 'Twitter/X', href: 'https://twitter.com/mtiosavljevic' },
      { label: 'GitHub', href: 'https://github.com/magnetoid' },
    ],
    noteEyebrow: '> send_message --init',
    noteTitle: 'Prefer a direct route?',
    noteBody: 'For now, the safest contact path is direct email while the CMS-backed enquiry flow is rebuilt cleanly on the new platform.',
    notePrimaryAction: {
      label: 'Email directly',
      href: 'mailto:marko.tiosavljevic@gmail.com',
    },
    noteSecondaryAction: {
      label: 'Review services',
      to: '/services',
    },
  },
}

export const CMS_PAGE_DEFINITIONS = {
  home: {
    slug: 'home',
    title: 'Home',
    path: '/',
    summary: 'Hero, expertise grid, latest posts, and the home CTA panel.',
  },
  about: {
    slug: 'about',
    title: 'About',
    path: '/about',
    summary: 'Bio, expertise tags, proof points, external links, and the career timeline.',
  },
  services: {
    slug: 'services',
    title: 'Services',
    path: '/services',
    summary: 'Service cards, deliverables, delivery process, and the primary service CTA.',
  },
  contact: {
    slug: 'contact',
    title: 'Contact',
    path: '/contact',
    summary: 'Contact introduction, direct email, response details, and profile links.',
  },
} as const satisfies Record<CmsPageSlug, {
  slug: CmsPageSlug
  title: string
  path: string
  summary: string
}>

export function buildDefaultPageRecord<TSlug extends CmsPageSlug>(slug: TSlug): CmsPageRecord<TSlug> {
  return {
    id: `default-${slug}`,
    slug,
    title: CMS_PAGE_DEFINITIONS[slug].title,
    status: 'published',
    seoTitle: CMS_PAGE_DEFINITIONS[slug].title,
    seoDescription: '',
    content: DEFAULT_SITE_PAGES[slug],
  }
}
