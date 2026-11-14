/**
 * The services offered on mtiosavljevic.com, written for a business owner:
 * the problem in their words, what gets done, and what they end up with.
 *
 * Tools and scope come from Marko's public Upwork profile and contract
 * history. No result figures are promised here; proof lives on /results.
 */

export interface Service {
  id: string
  name: string
  /** The client's problem, said the way they would say it. */
  pain: string
  /** One-sentence promise. */
  promise: string
  whatIDo: string[]
  youGet: string[]
  tools: string
  /** Case-study slugs that show this kind of work. */
  proof: { slug: string; label: string }[]
}

export const SERVICES: Service[] = [
  {
    id: 'ai-automation',
    name: 'AI & automation',
    pain: 'Your team spends its days on work a machine should be doing.',
    promise:
      'I build AI systems that take over the repetitive work, so the same people get more done and your costs stop growing with your revenue.',
    whatIDo: [
      'Find the tasks that eat the most hours: support replies, lead follow-up, reporting, bookkeeping, content.',
      'Build custom AI agents and workflows that do those tasks, with a human approving anything that matters.',
      'Connect them to the tools you already use: your store, CRM, inbox, ad accounts and accounting.',
      'Run them on the right model for the job, including self-hosted models when your data must stay private.',
    ],
    youGet: [
      'Hours back every week, on work that used to need a person',
      'Lower cost per order, per lead and per ticket',
      'Systems you own, with no lock-in to one AI vendor',
    ],
    tools: 'Anthropic Claude, OpenAI, open-source and self-hosted models, MCP, custom agents',
    proof: [
      { slug: 'clearcount', label: 'ClearCount: an AI finance team for e-commerce' },
      { slug: 'imba-crm', label: 'Imba CRM: AI-assisted sales with human approval' },
      { slug: 'quorum', label: 'Quorum: answers checked by a council of models' },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce build & growth',
    pain: 'Your store gets visitors, but too few of them buy, and too few come back.',
    promise:
      'I build and tune stores that convert, then add the retention that makes each customer worth more.',
    whatIDo: [
      'Build or rebuild the store on Shopify, WooCommerce or BigCommerce, with a structure that will not hold you back later.',
      'Fix what loses sales: slow pages, a confusing checkout, weak product pages.',
      'Set up email and SMS automation that recovers carts and brings buyers back.',
      'Work out your real profit per order, after ads, fees, refunds and cost of goods.',
    ],
    youGet: [
      'A higher share of visitors who buy',
      'More repeat orders from customers you already paid to win',
      'A clear view of profit, with revenue and margin kept apart',
    ],
    tools: 'Shopify, WooCommerce, BigCommerce, Omnisend, custom storefronts',
    proof: [
      { slug: 'morpheus', label: 'Morpheus OS: an AI-native commerce platform, live at dotbooks.store' },
      { slug: 'woopulse', label: 'WooPulse: an AI brain for WooCommerce stores' },
    ],
  },
  {
    id: 'performance-marketing',
    name: 'Performance marketing & tracking',
    pain: 'You are spending on ads and cannot say for certain which of them make money.',
    promise:
      'I fix the measurement first, then run the campaigns, so every decision about budget is made on numbers you can believe.',
    whatIDo: [
      'Set up tracking properly: GA4, Tag Manager, conversion tracking and the data layer behind them.',
      'Run and restructure Google Ads and Meta campaigns around profit, with return on ad spend measured honestly.',
      'Clean up product feeds and Merchant Center so shopping campaigns can work.',
      'Recover disabled ad accounts and untangle setups other people left behind.',
    ],
    youGet: [
      'Ad spend you can trace to sales',
      'Budget moved from what loses money to what earns it',
      'Reports you can read in five minutes',
    ],
    tools: 'Google Ads, Meta Ads, GA4, Google Tag Manager, Merchant Center, HubSpot',
    proof: [],
  },
  {
    id: 'seo-aeo',
    name: 'SEO & AI search',
    pain: 'Customers search for what you sell and find your competitors. Now they ask ChatGPT, and it does not mention you either.',
    promise:
      'I make your site easy for Google to rank and easy for AI assistants to quote, so you are found in both places.',
    whatIDo: [
      'Fix the technical base: speed, Core Web Vitals, crawlability and site structure.',
      'Add structured data so search engines and AI models understand what you sell.',
      'Build internal linking and content around what your buyers search for.',
      'Check how AI assistants describe your brand today, and work on the answers they give.',
    ],
    youGet: [
      'More visitors you did not pay for',
      'A site that loads fast and passes Core Web Vitals',
      'A brand that shows up when people ask an AI for a recommendation',
    ],
    tools: 'Technical SEO, Core Web Vitals, structured data, Search Console, AEO',
    proof: [
      { slug: 'wp-interlinking', label: 'WP Interlinking: automated internal linking for WordPress' },
      { slug: 'seo-skills-for-ai-agents', label: 'SEO Skills for AI Agents: 14 open-source skills' },
    ],
  },
  {
    id: 'video',
    name: 'Video & creative',
    pain: 'Your ads and product pages look like everyone else’s, and people scroll past.',
    promise:
      'Through Imba Production I lead a full production team that makes video built to sell, from brand films to the short clips ads need every week.',
    whatIDo: [
      'Plan creative around the offer and the audience, with the sale as the goal.',
      'Produce studio-grade brand and product video.',
      'Produce user-style (UGC) video in volume for paid social.',
      'Use AI in the content workflow to make more variations at lower cost.',
    ],
    youGet: [
      'Creative that gives your ads something to work with',
      'A steady supply of new video to test',
      'One team for the strategy, the shoot and the edit',
    ],
    tools: 'Imba Production (founded 2005), studio production, UGC, AI content workflows',
    proof: [],
  },
]

/** The kinds of jobs clients actually hire for. Source: Upwork contract history. */
export const TYPICAL_ENGAGEMENTS = [
  'AI bookkeeping software built with Claude',
  'Email and SMS automation on Omnisend',
  'Full tracking setup: GA4, Tag Manager, conversions',
  'Google Ads management and consultancy',
  'Core Web Vitals and site-speed fixes',
  'Shopify, Merchant Center and Google Ads together',
  'Recovering disabled Facebook, Instagram and Google ad accounts',
  'Landing pages and database-driven websites',
  'UGC and recipe video production',
  'Ongoing development and marketing for agencies',
]

export interface ApproachStep {
  step: string
  title: string
  body: string
}

export const APPROACH_STEPS: ApproachStep[] = [
  {
    step: '01',
    title: 'Look at the numbers first',
    body: 'Before proposing anything I look at what is true today: where the money comes in, where it leaks, and whether your tracking can be trusted. Most plans fail because they were built on numbers nobody checked.',
  },
  {
    step: '02',
    title: 'Pick the one thing that pays back fastest',
    body: 'There are always twenty things that could be improved. I pick the one or two that will return the most for the least, and say plainly what I expect them to do.',
  },
  {
    step: '03',
    title: 'Build it myself',
    body: 'I do the work: the code, the campaigns, the automation. You talk to the person building it, so nothing is lost between a strategist and a team you never meet.',
  },
  {
    step: '04',
    title: 'Measure against money',
    body: 'Results are counted in revenue, profit and hours saved. Clicks and impressions are only useful as steps towards those.',
  },
  {
    step: '05',
    title: 'Stay until it works',
    body: 'I do not hand over a report and disappear. Some of my client contracts have been running for years, because a system that earns keeps needing someone who understands it.',
  },
]

export const PRINCIPLES = [
  {
    title: 'One senior person',
    body: 'You get me, with 38 years of software and 30 of marketing behind me. There are no account managers and no juniors learning on your budget.',
  },
  {
    title: 'You own everything',
    body: 'The code, the ad accounts, the data and the automations are yours. If we stop working together, nothing stops working.',
  },
  {
    title: 'Honest numbers',
    body: 'A metric that is missing shows up as missing. I would sooner show you a gap than a comfortable figure that hides a problem.',
  },
  {
    title: 'AI where it pays',
    body: 'I research AI and build with it every day, so I know where it earns its keep and where it is a toy. You get it only where it pays.',
  },
]
