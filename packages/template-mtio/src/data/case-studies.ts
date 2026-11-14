/**
 * Product and open-source case studies, carried over from the live
 * mtiosavljevic.com site. `track` decides which menu a study appears under:
 * 'build' = Build & Research, 'marketing' = Marketing & Services.
 */
export type CaseStudyTrack = 'build' | 'marketing'

export interface CaseStudyData {
  slug: string
  name: string
  /** Omitted when there is no public URL — the repo is private or the site is down. */
  url?: string
  year: string
  category: string
  tagline: string
  hero: string
  summary: string
  role: string
  accent: string
  stack: string[]
  stats: { num: string; label: string }[]
  problem: { title: string; body: string }
  approach: { title: string; body: string }[]
  features: { title: string; desc: string }[]
  outcomes: { metric: string; label: string }[]
  lessons: string[]
  quote?: { text: string; attribution: string }
}

export const CASE_STUDIES: CaseStudyData[] = [
  // ────────────────────────────────────────────────────────────
  //   CLEARCOUNT
  // ────────────────────────────────────────────────────────────
  {
    slug: 'clearcount',
    name: 'ClearCount',
    url: 'https://clearcount.ai',
    year: '2026',
    category: 'AI · E-commerce Finance',
    accent: '#14B8A6',
    tagline: 'The AI finance team for your e-commerce business',
    hero: 'One login. Every revenue source. Real profit — not guesswork. ClearCount connects your stores, banks, and ad accounts, reconciles them into one clean ledger, and gives you an AI copilot that already knows whether you made money this month.',
    summary:
      'ClearCount is a multi-tenant AI finance platform for e-commerce operators. It pulls Shopify, Zendrop, Mercury, Slash, Google Ads, Meta Ads, QuickBooks, and Xero into a single linked ledger, runs four automatic reconciliation passes, and computes true profit — gross margin, ROAS, CAC, LTV, cohort retention — from real commerce data. A commerce-aware AI assistant with 13 tools answers questions about the business in seconds, with the numbers already checked.',
    role: 'Product architecture, full-stack engineering, integration clients, the reconciliation & metrics engine, AI tool layer, and multi-tenant security.',
    stack: [
      'Next.js 16 (App Router)',
      'React 19',
      'TypeScript (strict)',
      'Tailwind CSS v4',
      'shadcn/ui',
      'Recharts',
      'Prisma 7',
      'PostgreSQL (Supabase)',
      'NextAuth.js',
      'Anthropic / OpenAI / Google / OpenRouter / Ollama',
      'Vercel AI Gateway',
      'Web Speech API / Whisper / TTS',
    ],
    stats: [
      { num: '8', label: 'data sources in one ledger' },
      { num: '13', label: 'commerce-aware AI tools' },
      { num: '6', label: 'stage connect-to-serve pipeline' },
      { num: 'AES-256', label: 'per-workspace credential encryption' },
    ],
    problem: {
      title: 'Every Sunday turns into a CSV-and-spreadsheet marathon',
      body: 'Running an online store means living across a dozen tabs — Shopify for orders, Mercury for the bank, Google and Meta for ads, Zendrop for suppliers, QuickBooks for the accountant. Answering one question — "did I actually make money this month?" — means exporting CSVs and reconciling them by hand. Vanity revenue is easy to see; true profit, after refunds, COGS, ad spend, and processor fees, is buried. And the AI tools that promised to help usually answer with generic advice because they have no live context on the actual business.',
    },
    approach: [
      {
        title: 'A linked graph, not a flat list',
        body: 'ClearCount is not a spreadsheet of rows — every record has a typed relationship to the others. Orders link to line items, payouts, transactions, and disputes. Crucially, unit cost and FX rate are snapshotted onto each line item at sync time, so the cost of a product today can never retroactively change the margin on an order shipped six months ago. Old orders stay accurate forever.',
      },
      {
        title: 'Reconciliation that runs itself',
        body: 'Four passes run automatically: payouts matched to bank deposits by currency, amount (±$0.01), and date (±3 days); true COGS pulled from Shopify InventoryItem and layered with Zendrop supplier costs; UTM attribution parsed from landing URL, note attributes, then referrer; and supplier-spend detection that buckets inventory cost out of opex so gross margin stays honest. Ambiguous matches are surfaced for a human to resolve — never silently guessed.',
      },
      {
        title: 'An AI copilot with live business context',
        body: 'Chat or talk with Claude, GPT, or Gemini — the operator picks the provider, routed through the Vercel AI Gateway for unified fallbacks and observability. The assistant calls 13 commerce-aware tools (get_business_snapshot, get_order_margin, get_payout_health, get_campaign_roas, get_customer_ltv, get_cohort_retention, get_disputes, and more) so its answers are specific to the workspace, not generic.',
      },
      {
        title: 'Tenant isolation enforced at the source',
        body: 'Every table is scoped by tenantId and every API route runs through a withTenant guard that blocks cross-workspace reads at the database, not in app logic. Every credential is AES-256-GCM encrypted before it touches the DB and never logged in plaintext — so agencies and portfolio owners can run many stores under one account with zero data crossover.',
      },
    ],
    features: [
      { title: 'One source of truth', desc: 'Shopify, Zendrop, Mercury, Slash, Google Ads, Meta Ads, QuickBooks, and Xero all flowing into a single tidy ledger.' },
      { title: 'Self-reconciling payouts', desc: 'A Shopify payout of $4,823.17 is matched to the Mercury deposit automatically, down to the cent — unmatched items flagged, never guessed.' },
      { title: 'Real profit, not vanity revenue', desc: 'A full margin ladder — gross profit, contribution margin, true profit — plus ROAS, CAC, LTV, and cohort retention computed from linked data.' },
      { title: 'AI assistant with voice', desc: 'A commerce-aware copilot with 13 tools, multi-provider routing, and hands-free voice mode via Web Speech, Whisper, and TTS.' },
      { title: 'Smart expense categorization', desc: 'Supplier invoices, ad spend, SaaS, and refunds land in the right bucket — regex rules first, AI fallback second.' },
      { title: 'Books-ready export', desc: 'One-click, idempotent double-entry journals to QuickBooks or Xero, plus RFC 4180 CSV export any accountant can drop in.' },
    ],
    outcomes: [
      { metric: '8', label: 'fragmented sources unified into one ledger' },
      { metric: '±$0.01', label: 'payout-to-bank matching precision' },
      { metric: '13', label: 'AI tools operating on live workspace data' },
      { metric: 'null', label: 'over a fake zero — broken metrics show up broken' },
    ],
    lessons: [
      'A linked graph beats a flat list. Typed relationships plus cost/FX snapshots are what let old orders stay accurate while new data flows in.',
      'Return null, not a fake zero. A missing metric that shows up broken is honest; one that quietly reads zero hides the bug until it costs money.',
      'Enforce tenant isolation at the database, not in app code. A withTenant guard at the source makes cross-workspace leaks structurally impossible rather than a code-review hope.',
    ],
    quote: {
      text: 'The whole pitch is replacing the Sunday-night spreadsheet marathon with one dashboard and an AI that already knows the answer — built on a ledger honest enough that you can trust the number it gives you.',
      attribution: 'Marko Tiosavljevic — creator, ClearCount',
    },
  },

  // ────────────────────────────────────────────────────────────
  //   ALETHIA.ME
  // ────────────────────────────────────────────────────────────
  {
    slug: 'alethia',
    name: 'Aletheia',
    url: 'https://alethia.me',
    year: '2026',
    category: 'AI · Forensic Intelligence',
    accent: '#10B981',
    tagline: 'AI-Powered Anticorruption Intelligence',
    hero: 'Corruption costs the world $2.6 trillion every year. Aletheia is the platform built to fight it — with forensic rigor, court-ready evidence, and zero hallucinations.',
    summary:
      'Aletheia is a multi-model AI forensic intelligence platform designed for investigative journalists, prosecutors, compliance officers, and anticorruption agencies. It ingests public records, maps hidden ownership networks, and produces courtroom-admissible reports — in a fraction of the time manual investigations require.',
    role: 'Product architecture, AI orchestration, full-stack engineering, network visualization, on-premise deployment.',
    stack: [
      'Claude API',
      'GPT-4',
      'Gemini',
      'Perplexity',
      'Ollama',
      'Node.js',
      'PostgreSQL',
      'D3.js',
      'React + TypeScript',
      'Docker / Coolify',
      'Supabase',
    ],
    stats: [
      { num: '7', label: 'phase forensic pipeline' },
      { num: '5', label: 'providers merged in Ensemble mode' },
      { num: '0', label: 'hallucination tolerance' },
      { num: '2', label: 'languages (EN / SR)' },
    ],
    problem: {
      title: 'Investigations that should take weeks take years',
      body: 'Anticorruption work drowns in documents. Procurement filings, court decisions, company registries, sanctions lists, leaked databases — all scattered, inconsistent, and written for lawyers, not search engines. Under 4% of corruption cases end in successful prosecution, not because the evidence isn\'t there, but because analysts can\'t connect it fast enough. Traditional AI tools made this worse: a single model will confidently invent a beneficial owner or cite a court case that doesn\'t exist. In a courtroom, one hallucination destroys the entire file.',
    },
    approach: [
      {
        title: 'Zero Hallucination Protocol',
        body: 'Every factual claim carries a mandatory inline citation an analyst can click through and verify; anything without a source is explicitly labelled [AI Knowledge] and never presented as established fact. In Ensemble mode all five providers — Gemini, GPT-4o, Claude, Perplexity, Ollama — run in parallel and are merged: entities deduplicated (diacritic-aware), risk scores averaged, the most detailed answer kept.',
      },
      {
        title: 'A seven-phase forensic pipeline',
        body: 'Identity verification → entity mapping → timeline reconstruction → financial analysis → procurement audit → legal assessment → typology scoring. Each phase produces structured output the next one consumes. The analyst stays in the loop at every handoff.',
      },
      {
        title: 'Built for sensitive infrastructure',
        body: 'The entire stack runs air-gapped on-premise via Ollama for clients who can\'t send data to a cloud API. For everyone else, a multi-tenant SaaS runs on self-hosted Supabase and Coolify — encrypted at rest, isolated per organization, and exportable.',
      },
      {
        title: 'Evidence that holds up in court',
        body: 'Reports include a full chain of custody: which model said what, which source backed the claim, which analyst approved it, which criminal code article applies. Exports are legal-formatted and bilingual — English and Serbian — to match prosecutorial workflows in the Western Balkans.',
      },
    ],
    features: [
      { title: 'Multi-model consensus engine', desc: 'Four AI providers cross-validate every finding. Conflicts flagged, never silently resolved.' },
      { title: 'Network graph visualization', desc: 'Interactive D3.js force graphs expose beneficial ownership, shared directors, and shell company clusters at a glance.' },
      { title: 'Procurement anomaly detection', desc: 'Detects single-bidder tenders, value-splitting, and suspicious award patterns across public tender data.' },
      { title: 'Evidence locker', desc: 'Drag-and-drop document upload. AI-powered OCR, entity extraction, and automatic linking back to the active investigation.' },
      { title: 'Legal code mapping', desc: 'Every finding is matched to the relevant criminal code articles — jurisdiction-aware — so the prosecutorial handoff is a click, not a week of rewriting.' },
      { title: 'Watchlist monitoring', desc: 'Persistent tracking of entities of interest. Automated alerts when new filings, sanctions, or media mentions surface.' },
    ],
    outcomes: [
      { metric: '5', label: 'AI providers merged in Ensemble mode' },
      { metric: '7', label: 'forensic phases automated end-to-end' },
      { metric: 'Cited', label: 'by protocol — unsourced claims are labelled, not asserted' },
      { metric: 'Air-gap', label: 'capable via on-premise Ollama' },
    ],
    lessons: [
      'For high-stakes AI, consensus beats benchmarks. Accuracy claims from a single model are meaningless when the cost of being wrong is a thrown case.',
      'Air-gap is a feature, not a limitation. Building for Ollama first forced an architecture that works everywhere — cloud, on-prem, or behind a firewall — without code changes.',
      'Structured handoffs between AI phases are what separates a demo from a platform. Unstructured chain-of-thought cannot be audited; typed contracts can.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   WOOPULSE.COM
  // ────────────────────────────────────────────────────────────
  {
    slug: 'woopulse',
    name: 'WooPulse',
    url: 'https://woopulse.com',
    year: '2026',
    category: 'SaaS · eCommerce AI',
    accent: '#C084FC',
    tagline: 'The AI brain for your WooCommerce store',
    hero: 'Stop guessing. Start growing. WooPulse plugs into your WooCommerce store and turns raw transactional data into revenue — through AI-drafted recovery emails, dynamic pricing, and competitor intelligence that runs while you sleep.',
    summary:
      'WooPulse is a multi-model AI platform that solo founders, growing brands, and agencies plug into their WooCommerce stores to automate the revenue work that nobody has time to do manually: cart recovery, price optimization, product copywriting, and competitor monitoring — all powered by consensus between Claude, GPT-4o, Gemini, and self-hosted Ollama.',
    role: 'Product strategy, full-stack SaaS build, multi-model AI orchestration, WooCommerce integration, billing & onboarding.',
    stack: [
      'React + TypeScript',
      'Vite',
      'Node.js',
      'WooCommerce REST API',
      'Claude API',
      'GPT-4o',
      'Gemini',
      'Ollama',
      'PostgreSQL',
      'Supabase',
      'Stripe',
      'Docker / Coolify',
      'Mailgun',
    ],
    stats: [
      { num: '3', label: 'models in consensus drafting' },
      { num: 'REST', label: 'single WooCommerce API integration' },
      { num: '3', label: 'pricing tiers' },
      { num: 'Local', label: 'Ollama routing for private stores' },
    ],
    problem: {
      title: 'Small stores are drowning in the work that makes them grow',
      body: 'A solo WooCommerce founder has to be a merchandiser, a copywriter, a pricing analyst, a competitor researcher, and a customer service rep — all before lunch. Enterprise tools like Klaviyo and ProfitWell exist, but they are priced and scoped for teams of ten. Everyone below that line has two options: guess, or give up. Meanwhile, 70% of carts are abandoned, prices drift away from optimal by the week, and product copy never gets the A/B test it deserves. The revenue is sitting on the table.',
    },
    approach: [
      {
        title: 'One plugin install, full intelligence layer',
        body: 'WooPulse connects through the WooCommerce REST API in under five minutes. From the first sync, it sees orders, carts, customers, SKUs, and competitors — and starts scoring opportunities. No tag manager. No event schema. No developer required.',
      },
      {
        title: 'Multi-model where it matters, one model where it doesn\'t',
        body: 'Product copy and abandonment emails get consensus drafting across Claude, GPT-4o, and Gemini — three drafts, best elements merged. Price suggestions and anomaly detection run on lightweight in-house models to keep margins on the AI itself healthy.',
      },
      {
        title: 'Three tiers that match how real stores grow',
        body: 'Starter (€29/mo) for founders under 500 orders. Growth (€79/mo) for the scaling phase where automation pays for itself in week one. Agency (€199/mo) for operators running multiple client stores from a single dashboard. Every tier includes a 14-day trial and one-click export.',
      },
      {
        title: 'Self-hosted Ollama for privacy-sensitive verticals',
        body: 'Health, legal, adult, and finance stores can route generation through a local Ollama instance on the WooPulse server rather than the public APIs. Same UI, same workflow, zero customer data leaving the trust boundary.',
      },
    ],
    features: [
      { title: 'Abandoned cart recovery', desc: 'AI drafts personalized recovery emails that reference the exact product, a smart incentive, and the right send-time window. Plug into Mailgun or your existing ESP.' },
      { title: 'Dynamic pricing optimizer', desc: 'Tracks elasticity across your catalog and proposes price points that lift margin without killing conversion. You approve, the store updates.' },
      { title: 'AI product copywriting', desc: 'Bulk-generate or rewrite descriptions, meta titles, and short-form copy in your brand voice — with SEO keyword targeting built in.' },
      { title: 'Competitor intelligence', desc: 'Automated monitoring of competitor prices, promotions, and product launches. Weekly digests, instant alerts on aggressive moves.' },
      { title: 'Revenue command dashboard', desc: 'A single screen: today\'s revenue, AOV, cart-recovery-in-progress, margin by SKU, and the three actions that will move the needle this week.' },
      { title: 'Agency multi-store mode', desc: 'Manage unlimited client stores from one login. White-label reports, per-client billing, and role-based access built in.' },
    ],
    outcomes: [
      { metric: 'One', label: 'install, no tag manager or event schema' },
      { metric: 'Consensus', label: 'drafting where judgement matters' },
      { metric: 'Cheap', label: 'models where it does not' },
      { metric: 'Private', label: 'generation stays in the trust boundary' },
    ],
    lessons: [
      'WooCommerce is an unfair distribution advantage. A third of the ecommerce web runs on it, and almost nobody is building AI-native tooling specifically for that layer.',
      'Founders don\'t want dashboards — they want verdicts. Every screen we shipped got ruthlessly simplified down to the question: "What should I do today?"',
      'Pricing is product. Tiering by order volume rather than charging flat per store is what matched the pricing to how stores actually grow.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   NISAM.VIDEO
  // ────────────────────────────────────────────────────────────
  {
    slug: 'nisam-video',
    name: 'nisam.video',
    url: 'https://nisam.video',
    year: '2016 — ongoing',
    category: 'Media · AI Curation',
    accent: '#F59E0B',
    tagline: 'AI-curated video for a region the algorithm forgot',
    hero: 'A sophisticated video discovery platform transforming YouTube content exploration through intelligent categorization and user-centric design — with a dedicated focus on independent investigative journalism in the Balkans.',
    summary:
      'nisam.video is a long-running, personally funded video hub that aggregates, categorizes, and surfaces independent and investigative Serbian-language content from across YouTube. The name is a Serbian pun — "nisam" means "I am not" — a quiet inversion of the region\'s political rhetoric: a platform for the voices that the mainstream says they are not.',
    role: 'Founder, developer, and curator. Solo build and continuous operation since 2016.',
    stack: [
      'WordPress / custom theme',
      'YouTube Data API',
      'PHP + MySQL',
      'Custom taxonomy engine',
      'JS front-end',
      'AI classification layer (2024+)',
      'Self-hosted infrastructure',
    ],
    stats: [
      { num: '10+', label: 'years continuous operation' },
      { num: '1000s', label: 'of videos curated' },
      { num: '2', label: 'flagship channel streams (N1, Insajder)' },
      { num: '1', label: 'operator — solo project' },
    ],
    problem: {
      title: 'Algorithms don\'t serve small languages or small democracies',
      body: 'For a Serbian-speaking viewer who wants verified, independent journalism, YouTube\'s recommendation engine is useless — often actively hostile. It surfaces outrage, it buries long-form, and it has no concept of editorial weight. Meanwhile, channels like Insajder TV and N1 — doing the slow, serious work of investigative reporting in a region where that work is genuinely dangerous — stay invisible to the casual viewer who might otherwise become a regular one. The information exists. The discovery does not.',
    },
    approach: [
      {
        title: 'Editorial curation as the product',
        body: 'nisam.video was never built to scale — it was built to be right. Every channel admitted to the platform is vetted. Every video surfaced is categorized by a human-plus-AI pass before it shows up on the homepage. Reach is a side effect of trust.',
      },
      {
        title: 'A custom taxonomy engine',
        body: 'YouTube\'s own categories are useless for investigative work. nisam.video runs a custom taxonomy — program, topic, subject, timeline event, named entity — so a viewer can follow a story, not a channel. AI classification (added in 2024) automates the first pass; a human confirms.',
      },
      {
        title: 'Live streams pinned where they belong',
        body: 'N1 and Insajder TV have dedicated live-stream pages that survive YouTube URL changes, channel rebrands, and regional blackouts. One URL the audience can bookmark — we handle the plumbing behind it.',
      },
      {
        title: 'Ten years of compounding archive',
        body: 'The platform has been online since 2016. Every curated video, every interview, every daily news segment is still reachable at a stable URL — a searchable record of the region\'s political and media history that YouTube alone does not preserve.',
      },
    ],
    features: [
      { title: 'Curated channel roster', desc: 'Vetted independent and investigative sources — Insajder TV, N1, and more — surfaced as first-class citizens of the homepage.' },
      { title: 'Program-level categorization', desc: 'Follow "Insajder Intervju" or "Dnevnik N1" as a program, across years — not just as a channel feed.' },
      { title: 'AI classification layer', desc: 'Incoming videos auto-tagged by topic, entity, and sentiment before editorial review. Built on a lightweight local model to keep curation costs near zero.' },
      { title: 'Stable archive URLs', desc: 'Every video lives at a permanent nisam.video URL, even when the underlying YouTube source is moved, renamed, or removed.' },
      { title: 'Live stream redirector', desc: 'Dedicated /n1-video-stream/ and /insajder-tv/ pages that always resolve to the current live feed — no hunting required.' },
      { title: 'Regional-first performance', desc: 'Fast-loading, mobile-heavy design optimized for Balkan mobile networks and the actual devices the audience is on.' },
    ],
    outcomes: [
      { metric: '10 yrs', label: 'of continuous uptime since 2016' },
      { metric: '0 €', label: 'external funding — self-sustained' },
      { metric: '100%', label: 'of featured content vetted before publication' },
      { metric: '∞', label: 'patience for stories the algorithm won\'t carry' },
    ],
    lessons: [
      'Scale is not the point. For small languages and regional journalism, being the right-sized, trusted hub beats chasing global numbers — and it survives longer.',
      'AI didn\'t replace curation; it made curation tractable. A solo operator with a classification model can now do what a newsroom editorial team used to.',
      'Owning the URL is owning the archive. Every piece of content that only lives on a platform you don\'t control is a piece of history that can be deleted for you.',
    ],
    quote: {
      text: 'Building nisam.video was never about product-market fit. It was about making sure the stories that matter in this region have somewhere to live that isn\'t at the mercy of a recommendation algorithm.',
      attribution: 'Marko Tiosavljevic — founder, nisam.video',
    },
  },

  // ────────────────────────────────────────────────────────────
  //   MORPHEUS OS
  // ────────────────────────────────────────────────────────────
  {
    slug: 'morpheus',
    name: 'Morpheus OS',
    url: 'https://dotbooks.store',
    year: '2026',
    category: 'Open Source · Agentic Commerce',
    accent: '#06B6D4',
    tagline: 'A modular, plugin-native, AI-native ecommerce platform',
    hero: 'Catalog → cart → checkout → fulfillment in a tiny core. Everything else is a plugin. Morpheus OS ships the multi-protocol agent gateway that Shopify, Adobe, and BigCommerce are racing toward — today, behind toggleable plugins rather than a hosted add-on.',
    summary:
      'Morpheus OS is an open-source, event-sourced ecommerce platform built on a deliberately tiny Django core — catalog, cart, checkout, fulfillment — with 60+ first-party plugins providing everything else. Its defining bet is plugin-native modularity plus a first-class agent layer: a hard-coded merchant Assistant, a real agent kernel, and an MCP server cluster that lets external AI clients transact directly.',
    role: 'Platform architecture, core engine, plugin & theme SDK, agent kernel, MCP / UCP protocol surfaces, the 2026 SEO/AEO stack, and deployment.',
    stack: [
      'Django 6',
      'Python',
      'PostgreSQL',
      'Redis',
      'Celery',
      'NATS JetStream',
      'GraphQL (Strawberry)',
      'DRF',
      'three.js',
      'MCP / UCP',
      'OpenAI / Anthropic / Gemini / Grok / Ollama',
      'Docker / Coolify',
    ],
    stats: [
      { num: '60+', label: 'plugins enabled by default' },
      { num: '4', label: 'audience-scoped MCP endpoints' },
      { num: '20+', label: 'built-in Assistant tools' },
      { num: '~20s', label: 'one-prompt store bootstrap' },
    ],
    problem: {
      title: 'Commerce platforms bolt AI on as an afterthought',
      body: 'Most "AI for ecommerce" tools fall into one of two buckets: plugins that automate rules, or chatbots that advise. Neither is a tool-using agent that can actually read your store and act on it. At the same time, monoliths make extension dangerous — a new feature means touching the engine, and removing one leaves dangling references and half-wired surfaces. The result is platforms that can neither be cleanly extended nor honestly called agent-native.',
    },
    approach: [
      {
        title: 'A tiny core — everything else is a plugin',
        body: 'The engine is small: catalog, cart, checkout, fulfillment, and a handful of foundations. The defining principle is the modularity contract — a theme exposes named slots, plugins fill them, and disabling a plugin removes its surfaces with no dangling references. Plugin crashes are isolated at activation time: a broken plugin is logged and excluded while every sibling keeps loading.',
      },
      {
        title: 'AI-native, not AI-attached',
        body: 'Where other platforms consume an AI API, Morpheus treats agents as a first-class audience. A hard-coded merchant Assistant lives in the core and survives plugin failure; a real agent kernel provides a tool-use loop, capability scopes, and a provider abstraction; and a brand-voice config edited once propagates to every generation in the system.',
      },
      {
        title: 'Agentic-commerce surfaces external clients can transact through',
        body: 'An MCP server cluster exposes four audience-scoped endpoints (storefront / cart / checkout / admin) over JSON-RPC 2.0, plus Universal Commerce Protocol and Trusted-Agent discovery at /.well-known/. External AI clients — Claude, ChatGPT, Perplexity — can browse and buy without per-vendor integrations.',
      },
      {
        title: 'A 2026 SEO + AEO stack, closed end-to-end',
        body: 'A dedicated SEO plugin ships a 15-bot AI-crawler matrix, per-object JSON-LD, llms.txt, per-product markdown export, RSS/Atom feeds, IndexNow auto-push, and auto-generated Google Web Stories per product — so the catalog is discoverable by both search engines and the new generation of AI answer engines.',
      },
    ],
    features: [
      { title: 'The modularity contract', desc: 'Themes own slots and presentation; plugins own features and fill slots. Disable a plugin and its routes, blocks, and nav links simply vanish — enforced at activation, with crash isolation.' },
      { title: 'Hard-coded merchant Assistant', desc: 'An always-on operator in the core with 20+ tools spanning reads and gated writes, plus JSONL fallback persistence so the chat works even when the database is down.' },
      { title: 'MCP server cluster', desc: 'Four audience-scoped JSON-RPC endpoints plus UCP and Trusted-Agent discovery — Shopify-shape, so external agents integrate once and transact everywhere.' },
      { title: 'One-prompt store bootstrap', desc: 'A merchant describes a concept in one sentence; Morpheus generates brand voice, categories, and 10–12 starter products in about 20 seconds. Idempotent on a hash of the prompt.' },
      { title: 'Event-sourced + transactional outbox', desc: 'Every state change emits a hook and writes to an outbox shipped to NATS JetStream — replayable, auditable, with HMAC-SHA256 on every outbound webhook.' },
      { title: 'Auto Google Web Stories', desc: 'A valid AMP story is generated per product from images and metadata on every save, embedded on the PDP and surfaced to Google Discover via the sitemap.' },
    ],
    outcomes: [
      { metric: '60+', label: 'first-party plugins shipping by default' },
      { metric: '4', label: 'MCP surfaces + UCP & Trusted-Agent discovery' },
      { metric: '15-bot', label: 'AI-crawler policy matrix in the SEO plugin' },
      { metric: 'Live', label: 'in production at dotbooks.store' },
    ],
    lessons: [
      'Modularity is only real when it is enforced. A plugin system that does not isolate crashes and tear down surfaces cleanly is just folders — the contract has to be checked at activation.',
      'Building machine-actionable-first makes the AI layer feel native instead of bolted on. Every model, hook, and state transition is designed for an agent to operate before it is designed to look pretty.',
      'Protocol surfaces are the moat. Shipping MCP, UCP, and Trusted-Agent discovery today is what lets external AI clients transact without anyone building a custom integration.',
    ],
    quote: {
      text: 'Most platforms treat AI as a third-party API consumer. Morpheus treats agents as a first-class audience that sits on top of a complete commerce platform — that is the whole bet.',
      attribution: 'Marko Tiosavljevic — creator, Morpheus OS',
    },
  },

  // ────────────────────────────────────────────────────────────
  //   TORSOR HELPER
  // ────────────────────────────────────────────────────────────
  {
    slug: 'torsor-helper',
    name: 'Torsor Helper',
    url: 'https://github.com/magnetoid/torsor-helper',
    year: '2026',
    category: 'AI · Developer Tooling',
    accent: '#7C3AED',
    tagline: 'The memory & coaching layer for AI coding agents',
    hero: 'Your AI agent has amnesia. Every new session starts from zero, and mid-session it forgets the rules you set an hour ago. Torsor Helper is the persistent brain that fixes that — one small Python MCP server that works with every AI coding tool.',
    summary:
      'Torsor Helper is a local-first Python MCP server that gives AI coding agents persistent memory and architectural guardrails. It combines four ideas rarely put together — a pyramidal project wiki, an external semantic memory, a symbol-level repo map, and a drift guard — plus a Coach that proactively recommends fixes over time. It speaks standard MCP, so it works with Claude Code, Codex, Cursor, and the rest.',
    role: 'Product design, the Python MCP server, the memory / index / recall engine, the CLI, and documentation.',
    stack: [
      'Python 3.11+',
      'Model Context Protocol (stdio)',
      'SQLite + FTS5',
      'Vector embeddings (fastembed, bge-small-en-v1.5)',
      'RRF hybrid fusion',
      'Markdown as source of truth',
    ],
    stats: [
      { num: '4', label: 'agent failure modes addressed' },
      { num: '215', label: 'tests passing' },
      { num: '0', label: 'API keys required — local-first' },
      { num: 'v0.2', label: 'the intelligence release' },
    ],
    problem: {
      title: 'AI coding agents are brilliant in the moment and forgetful over time',
      body: 'A new chat is a blank slate; long chats drift and lose how files connect; agents optimize for what is recent instead of what is important; and they quietly rebuild code that already exists and reintroduce patterns you explicitly rejected — with no audit trail. Most tools fix exactly one of these failure modes. Nothing kept the agent honest across sessions.',
    },
    approach: [
      {
        title: 'A pyramidal wiki the agent reads on every session start',
        body: 'A budgeted charter → system-patterns → tech-context → active-context hierarchy, surfaced through bootstrap_session and handoff, with contextual breadcrumbs so situating terms stay findable. The agent walks in already knowing the project.',
      },
      {
        title: 'External memory ranked by what is durable, not what is recent',
        body: 'Stability-ordered tiers plus hybrid recall — vector search and FTS5 fused via Reciprocal Rank Fusion — with importance decay and MMR diversity so durable, distinct knowledge floats up instead of whatever was said last.',
      },
      {
        title: 'Architectural intent captured as enforceable rules',
        body: 'ADRs-as-rules plus a check_drift guard with layering/seam rules and a CI baseline, so rejected patterns do not silently return and new drift fails the build rather than slipping in unnoticed.',
      },
      {
        title: 'Local-first with no API key required',
        body: 'Recall runs on a deterministic offline embedder by default; the optional embeddings extra upgrades to semantic vectors. Markdown is the source of truth, so memory is committable, reviewable, and diffable like the rest of the repo.',
      },
    ],
    features: [
      { title: 'bootstrap_session', desc: 'A budgeted summary of the whole project pyramid at session start, plus a hygiene digest — the agent is situated before it writes a line.' },
      { title: 'Hybrid recall', desc: 'Vector + FTS5 search fused with RRF, tuned with importance decay and MMR diversity so the right memory surfaces, not just the recent one.' },
      { title: 'Decisions & memory', desc: 'remember and record_decision persist facts and ADRs as Markdown notes that link to each other and survive across sessions.' },
      { title: 'Drift guard', desc: 'check_drift flags ADR-rule violations against a committed CI baseline; --strict fails CI on new drift only.' },
      { title: 'Repository map', desc: 'A symbol-level map with real reference edges feeds reuse and hotspot recommendations from the Coach.' },
      { title: 'MCP-native', desc: 'A standard stdio MCP server — point Claude Code, Codex, Cursor, or any MCP client at torsor mcp and it just works.' },
    ],
    outcomes: [
      { metric: '215', label: 'passing tests on the engine' },
      { metric: '0', label: 'API keys needed to run the full memory layer' },
      { metric: '4-in-1', label: 'wiki + semantic memory + repo map + drift guard' },
      { metric: 'Any', label: 'MCP client — Claude Code, Codex, Cursor, …' },
    ],
    lessons: [
      'External memory beats a bigger context window. A budgeted, ranked store the agent re-reads each session is more reliable than hoping the right thing is still in the window.',
      'Markdown as the source of truth keeps memory auditable. If the agent\'s brain is a pile of opaque vectors, you cannot review or correct it — committable notes you can.',
      'Memory is language-agnostic; the symbol map is not. The wiki and recall work on any stack, while the AST-based map and drift guard are Python-first today — knowing that boundary keeps expectations honest.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   QUORUM
  // ────────────────────────────────────────────────────────────
  {
    slug: 'quorum',
    name: 'Quorum',
    url: 'https://github.com/magnetoid/Quorum',
    year: '2026',
    category: 'AI · Consensus Engine',
    accent: '#F97316',
    tagline: 'One question. A council of models. A single, trusted answer.',
    hero: 'Single LLMs are confidently wrong. Quorum convenes a council of models, clusters their answers by meaning, measures agreement, and surfaces the most reliable response — making disagreement visible instead of hiding it behind one model\'s confidence.',
    summary:
      'Quorum is a production-grade consensus reasoning engine designed to eliminate AI hallucinations and vendor lock-in. Instead of trusting a single LLM, it orchestrates a council of models — GPT-4, Claude, Gemini, Llama, and more — clusters their responses semantically, measures agreement, and flags a Disputed Zone when they conflict, so you see dissent rather than blindly trust one potentially-wrong output.',
    role: 'Engine design, consensus and voting algorithms, semantic clustering, and tiered execution.',
    stack: [
      'Python 3.11+',
      'OpenAI / Anthropic / Gemini / Llama / Ollama',
      'High-dimensional embeddings',
      'Semantic clustering',
      'Speculative tiered execution',
      'Apache-2.0',
    ],
    stats: [
      { num: 'N', label: 'models in the council, not one' },
      { num: 'V2', label: 'speculative tiered execution' },
      { num: '2', label: 'domain-tuned similarity regimes' },
      { num: 'Apache-2.0', label: 'open source' },
    ],
    problem: {
      title: 'A single model is a single point of failure',
      body: 'Large language models are often confidently wrong, and betting a workflow on one of them also bets it on one vendor. The dangerous failure is not a model that says "I don\'t know" — it is a model that invents an answer and presents it with total confidence. There was no clean way to make that uncertainty visible and act on it.',
    },
    approach: [
      {
        title: 'Hybrid semantic voting',
        body: 'Lexical overlap is not enough, so Quorum clusters responses by meaning using high-dimensional embeddings rather than matching words. When local hardware is unavailable it falls back to remote embeddings automatically, so the voting layer always has a signal to work with.',
      },
      {
        title: 'Speculative tiered execution',
        body: 'Quorum starts with cheap or local models and speculatively launches higher tiers only if consensus is not reached within seconds — extreme speed for easy questions, deep reasoning for hard ones, without paying for the heavy models every time.',
      },
      {
        title: 'Domain-aware adaptive thresholds',
        body: 'Consensus is not one-size-fits-all. Code and logic use stricter similarity checks where every semicolon counts; creative and prose use higher semantic tolerance to embrace diverse but valid phrasings.',
      },
      {
        title: 'Make disagreement a feature',
        body: 'When models conflict, Quorum surfaces a Disputed Zone with the dissenting opinions instead of silently picking one. The output tells you not just the answer but how much to trust it.',
      },
    ],
    features: [
      { title: 'Council orchestration', desc: 'Query multiple providers for the same question and treat their answers as votes, not gospel.' },
      { title: 'Semantic clustering', desc: 'Group responses by meaning with embeddings so paraphrases count as agreement and genuine conflicts stand out.' },
      { title: 'Disputed-zone flagging', desc: 'When the council splits, dissent is shown explicitly rather than resolved behind your back.' },
      { title: 'Speculative tiers', desc: 'Cheap and local models answer first; expensive models are launched only when consensus is not yet reached.' },
      { title: 'Adaptive thresholds', desc: 'Per-domain similarity regimes — strict for code and logic, tolerant for creative and prose.' },
      { title: 'Remote embedding fallback', desc: 'Automatically uses hosted embeddings when local inference hardware is not available.' },
    ],
    outcomes: [
      { metric: '1', label: 'trusted answer from a whole council' },
      { metric: 'Visible', label: 'disagreement instead of hidden hallucination' },
      { metric: 'Tiered', label: 'cost — heavy models only when needed' },
      { metric: 'No', label: 'single-vendor lock-in' },
    ],
    lessons: [
      'The dangerous failure mode is confidence, not ignorance. Surfacing disagreement is more valuable than smoothing it into one tidy answer.',
      'Consensus needs to understand meaning, not match strings. Embedding-based clustering is what separates real agreement from coincidental wording.',
      'Speculative tiers make multi-model affordable. You only pay for the expensive council members when the cheap ones cannot agree.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   VEKTOR
  // ────────────────────────────────────────────────────────────
  {
    slug: 'vektor',
    name: 'Vektor',
    // Repo is not public (github.com/magnetoid/vektor returns 404), so no link.
    year: '2026',
    category: 'AI · Autonomous Media',
    accent: '#3B82F6',
    tagline: 'Direction and magnitude in AI — an autonomous, multilingual news portal',
    hero: 'Vektor discovers AI news from hundreds of sources, deduplicates, synthesizes original articles with Claude, translates them, generates audio, and publishes — all behind a full editorial CMS. A newsroom that runs itself, with a human editor in the loop.',
    summary:
      'Vektor is an autonomous, multilingual AI news portal. A seven-stage pipeline discovers content from hundreds of sources, deduplicates with vector similarity, rewrites and fact-checks with Claude, translates English to Serbian, narrates with ElevenLabs, and publishes through Payload CMS. Every AI stage is gated on environment variables and falls back to a stub, so the pipeline always flows.',
    role: 'Architecture, the discovery-to-publish pipeline, AI orchestration, the editorial CMS, internationalization, and deployment.',
    stack: [
      'Next.js 16 (App Router, RSC)',
      'TypeScript (strict)',
      'Tailwind v4',
      'shadcn/ui',
      'Payload CMS 3.85',
      'Drizzle ORM + Postgres 16 (pgvector)',
      'Redis 7 (BullMQ)',
      'Claude Sonnet 4.6',
      'ElevenLabs Multilingual v2',
      'Cloudflare R2',
      'Plausible / Sentry',
    ],
    stats: [
      { num: '7', label: 'stage discover-to-publish pipeline' },
      { num: '2', label: 'launch languages (EN / SR)' },
      { num: 'pgvector', label: 'cosine dedup of sources' },
      { num: 'Graceful', label: 'stub fallback per stage' },
    ],
    problem: {
      title: 'AI news is a firehose — and it ignores small languages',
      body: 'The volume of AI news is impossible to follow, it is overwhelmingly English-first, and the signal-to-noise ratio is brutal. Nobody is doing the slow work of synthesizing it into original, fact-checked articles, translating it for a Serbian-speaking audience, and narrating it for people who would rather listen — at the cadence the field actually moves.',
    },
    approach: [
      {
        title: 'A seven-stage pipeline, gated and resilient',
        body: 'discover → dedup → rewrite → verify → translate → tts → publish. Each AI stage is gated on its environment variables; with keys present, real Claude / ElevenLabs / R2 calls fire, and without them each stage falls back to a stub so the pipeline still flows end-to-end during development.',
      },
      {
        title: 'Deduplicate before you spend a token',
        body: 'Incoming sources are hashed and embedded, then compared by pgvector cosine similarity, so near-duplicate stories collapse into one before any expensive rewrite happens.',
      },
      {
        title: 'Synthesize, then verify',
        body: 'Claude Sonnet rewrites sources into original articles with adaptive thinking, and a dedicated verify stage acts as a hallucination guard before anything is translated or published.',
      },
      {
        title: 'Multilingual and multimodal by default',
        body: 'A translate stage produces Serbian alongside English, and ElevenLabs Multilingual narration is generated and stored on Cloudflare R2 — every article ships as text and audio, in two languages, behind a Payload editorial CMS.',
      },
    ],
    features: [
      { title: 'Source discovery', desc: 'RSS-driven ingestion from hundreds of sources into a raw queue.' },
      { title: 'Semantic dedup', desc: 'Hash + embedding + pgvector cosine similarity collapses near-duplicate stories before any rewrite.' },
      { title: 'Claude rewrite', desc: 'Original article synthesis with adaptive thinking — not summarization, but genuine rewriting.' },
      { title: 'Hallucination verify', desc: 'A dedicated Claude verification stage guards accuracy before translation or publish.' },
      { title: 'EN → SR translation + audio', desc: 'Serbian translation plus ElevenLabs Multilingual narration stored on R2 — text and audio in two languages.' },
      { title: 'Editorial CMS', desc: 'Payload CMS gives a human editor full oversight of the autonomous pipeline, with live setup status checks.' },
    ],
    outcomes: [
      { metric: '7', label: 'pipeline stages wired end-to-end' },
      { metric: '2', label: 'languages shipped per article' },
      { metric: 'Text + audio', label: 'every story, automatically' },
      { metric: 'Editor', label: 'always in the loop via Payload' },
    ],
    lessons: [
      'Gate every AI stage and give it a stub. Being able to run the whole pipeline without any keys is what makes an autonomous system actually developable.',
      'Dedup before you generate. Embedding-based similarity up front saves the most expensive step from running on stories you already covered.',
      'Autonomy still needs an editor. The CMS oversight layer is what makes a self-running newsroom trustworthy rather than reckless.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   IMBA CRM
  // ────────────────────────────────────────────────────────────
  {
    slug: 'imba-crm',
    name: 'Imba CRM',
    url: 'https://github.com/magnetoid/imba-crm',
    year: '2026',
    category: 'AI · CRM Platform',
    accent: '#EAB308',
    tagline: 'AI-assisted CRM with a multi-provider model router',
    hero: 'A lead funnel, inbox, AI email generation with manual approval, proposals, and invoices — wired to a model router that fans every request across six AI providers with policy-based fallbacks and cost accounting.',
    summary:
      'Imba CRM is an AI-assisted CRM built as a pnpm monorepo: an admin-first Vite + React SPA and a model-router library and HTTP server that routes requests across Anthropic, OpenAI, Google, Ollama, Deepgram, and Perplexity with policy-based fallbacks and cost accounting. It runs either on Supabase Edge Functions or a self-hosted model-router, and is designed to be the reusable CRM backend across projects.',
    role: 'Architecture, the model-router, the admin SPA, Supabase integration, and the proposals / invoices / onboarding flows.',
    stack: [
      'Vite + React + TypeScript',
      'TailwindCSS + Radix',
      'Supabase (Edge Functions, Postgres)',
      'model-router (TypeScript)',
      'Anthropic / OpenAI / Google',
      'Perplexity / Deepgram / Ollama',
      'Docker',
    ],
    stats: [
      { num: '6', label: 'AI providers behind one router' },
      { num: '2', label: 'deployment stacks (edge fn / HTTP)' },
      { num: 'Per-call', label: 'cost accounting' },
      { num: 'Manual', label: 'approval on every AI email' },
    ],
    problem: {
      title: 'Every project re-implements the same CRM and AI plumbing',
      body: 'A lead funnel, an inbox, AI-drafted outreach, proposals, invoices — every product needs them and every product rebuilds them. Worse, wiring AI in directly means provider lock-in, brittle failure when one API is down, and AI spend that nobody is actually tracking until the bill arrives.',
    },
    approach: [
      {
        title: 'One model router, six providers',
        body: 'A single model-router library and HTTP server fans requests across Anthropic, OpenAI, Google, Ollama, Deepgram, and Perplexity with policy-based fallbacks — so a provider outage degrades gracefully instead of taking the feature down, and every call is cost-accounted at the router.',
      },
      {
        title: 'A human gate on anything that leaves the building',
        body: 'AI drafts outreach email, but nothing sends without manual approval. The AI accelerates the work; the operator stays accountable for what the customer actually receives.',
      },
      {
        title: 'Two deployment stacks for one frontend',
        body: 'The same admin SPA runs against Supabase Edge Functions (the live path, reading provider credentials from a runtime-settings table) or against the in-repo model-router HTTP server behind nginx — pick the operational model that fits the project.',
      },
      {
        title: 'Designed to be a shared backend',
        body: 'Leads, inbox, proposals, invoices, and the model router are built to be the central CRM layer multiple products plug into, rather than a one-off baked into a single app.',
      },
    ],
    features: [
      { title: 'Lead funnel', desc: 'A pipeline view of leads from first touch through qualification to close.' },
      { title: 'Inbox', desc: 'A unified place to work conversations, with AI assistance on tap.' },
      { title: 'AI email generation', desc: 'Drafts outreach and replies — gated behind explicit manual approval before anything sends.' },
      { title: 'Proposals & invoices', desc: 'Turn a qualified lead into a sent proposal and a tracked invoice without leaving the CRM.' },
      { title: 'Multi-provider model router', desc: 'Anthropic, OpenAI, Google, Ollama, Deepgram, and Perplexity behind one interface with fallbacks.' },
      { title: 'Cost accounting', desc: 'Every AI call is metered at the router, so spend is visible per request rather than discovered on the invoice.' },
    ],
    outcomes: [
      { metric: '6', label: 'providers swappable without touching the app' },
      { metric: '1', label: 'router to integrate instead of N SDKs' },
      { metric: 'Tracked', label: 'AI cost on every request' },
      { metric: 'Reusable', label: 'CRM backend across projects' },
    ],
    lessons: [
      'Route AI through one seam, not many. A single router with fallbacks and cost accounting turns six fragile integrations into one observable one.',
      'Keep a human on the send button. Manual approval on AI-drafted email is what makes automated outreach safe to ship.',
      'Build the CRM as a backend, not a feature. The leverage is in a shared layer many products plug into — that is the direction Imba CRM is built to grow.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   INFLUENCER HUB
  // ────────────────────────────────────────────────────────────
  {
    slug: 'influencer-hub',
    name: 'Influencer Hub',
    // influencer-hub.info does not currently resolve, so no link.
    year: '2026',
    category: 'Development · Marketplace',
    accent: '#EC4899',
    tagline: 'A two-sided creator marketplace with escrow and built-in content rights',
    hero: 'Where vetted creators sell services and brands hire them — escrow payments, content rights baked into every deal, and a production-grade Next.js 16 and Stripe Connect stack underneath.',
    summary:
      'Influencer Hub is a two-sided creator marketplace where creators list services and brands hire them. It is built on Next.js 16 and React 19 with Prisma and PostgreSQL, Auth.js v5 for authentication, and Stripe Connect for marketplace payouts — with escrow and content-rights terms wired into the deal flow and the whole stack bundled to run from one Docker command.',
    role: 'Full-stack build, the marketplace and payments architecture, authentication, and Docker deployment.',
    stack: [
      'Next.js 16 (App Router, Turbopack)',
      'React 19',
      'TypeScript',
      'Tailwind CSS 4',
      'Auth.js v5',
      'Prisma 6',
      'PostgreSQL 16',
      'Stripe Connect',
      'Resend',
      'Docker',
    ],
    stats: [
      { num: '2-sided', label: 'creators and brands' },
      { num: 'Escrow', label: 'payments via Stripe Connect' },
      { num: 'Built-in', label: 'content rights per deal' },
      { num: '1 cmd', label: 'Docker stack — migrate + seed on boot' },
    ],
    problem: {
      title: 'Creator deals run on trust and handshakes',
      body: 'Brand-creator collaborations are mostly informal: payment happens on faith in one direction or the other, content usage rights are vague until there is a dispute, and there is no neutral layer holding the deal together. Both sides carry risk that a real marketplace should absorb.',
    },
    approach: [
      {
        title: 'Escrow as the default, not an add-on',
        body: 'Payments flow through Stripe Connect with the marketplace holding funds until the work is delivered — so creators know they will be paid and brands know they will get what they paid for.',
      },
      {
        title: 'Content rights written into the deal',
        body: 'Usage rights are part of the transaction itself rather than a side agreement, so what a brand can do with the content is unambiguous from the moment the deal is struck.',
      },
      {
        title: 'Vetted supply',
        body: 'Creators are vetted before they can sell, keeping quality high and giving brands a curated roster instead of an open free-for-all.',
      },
      {
        title: 'Production-grade from day one',
        body: 'Next.js 16 with standalone output, Prisma migrations and seeds that run automatically on container start, Auth.js v5 (credentials plus optional Google OAuth), and a one-command Docker stack that mirrors production.',
      },
    ],
    features: [
      { title: 'Creator profiles & services', desc: 'Creators list the services they sell with the terms attached.' },
      { title: 'Brand hiring flow', desc: 'Brands discover vetted creators and book them through a structured deal.' },
      { title: 'Escrow payments', desc: 'Stripe Connect holds funds until delivery and handles marketplace payouts.' },
      { title: 'Content-rights terms', desc: 'Usage rights are baked into each deal rather than negotiated on the side.' },
      { title: 'Auth.js v5', desc: 'Credentials sign-in plus optional Google OAuth, with magic-link email via Resend.' },
      { title: 'One-command stack', desc: 'docker compose up brings up the app and Postgres, running migrations and seeding demo creators automatically.' },
    ],
    outcomes: [
      { metric: 'Both', label: 'sides protected by escrow' },
      { metric: 'Clear', label: 'content rights on every deal' },
      { metric: 'Vetted', label: 'creator roster, not an open free-for-all' },
      { metric: 'Reproducible', label: 'production-parity Docker deploy' },
    ],
    lessons: [
      'The marketplace earns its cut by removing risk. Escrow and clear rights are the product — not features bolted onto a directory.',
      'Bake the contract into the transaction. Content rights that live inside the deal flow prevent the disputes that vague side agreements cause.',
      'Make the dev stack mirror production. Migrations and seeds on container boot mean what a developer runs locally is what ships.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   WP INTERLINKING
  // ────────────────────────────────────────────────────────────
  {
    slug: 'wp-interlinking',
    name: 'WP Interlinking',
    url: 'https://github.com/magnetoid/wp-interlinking',
    year: '2026',
    category: 'Marketing · SEO Automation',
    accent: '#0EA5E9',
    tagline: 'AI-powered SEO internal linking for WordPress',
    hero: 'Internal links are one of the most powerful — and most neglected — SEO levers. WP Interlinking automates the entire process: TF-IDF keyword-to-URL mapping, site-health scoring, and six AI providers, with zero manual work.',
    summary:
      'WP Interlinking is a WordPress plugin that automates internal linking — the high-impact, perpetually-ignored SEO task. It maps keywords to URLs with TF-IDF relevance analysis, scores overall site health, and draws on six AI providers to suggest and place links, so a site builds the internal structure search engines reward without an editor doing it by hand.',
    role: 'Plugin architecture, the TF-IDF relevance engine, AI-provider integration, and the WordPress admin experience.',
    stack: [
      'PHP 7.2+',
      'WordPress 5.8+',
      'TF-IDF analysis',
      '6 AI providers',
      'GPL-2.0',
    ],
    stats: [
      { num: '6', label: 'AI providers supported' },
      { num: 'v5.0.0', label: 'mature release line' },
      { num: 'TF-IDF', label: 'relevance scoring' },
      { num: 'Site', label: 'health scoring built in' },
    ],
    problem: {
      title: 'The best SEO lever nobody pulls',
      body: 'Internal links help search engines understand site structure, distribute page authority, and keep visitors engaged longer — yet they are almost always neglected because doing them well by hand is tedious and never-ending. The value is real and the work is exactly the kind people put off forever.',
    },
    approach: [
      {
        title: 'TF-IDF, not guesswork',
        body: 'Instead of naive keyword matching, WP Interlinking uses TF-IDF analysis to score how relevant a target URL actually is for a given phrase — so links are placed where they genuinely reinforce topical authority.',
      },
      {
        title: 'Six AI providers behind the suggestions',
        body: 'The plugin draws on six AI providers to propose and refine link opportunities, rather than betting the feature on a single vendor.',
      },
      {
        title: 'Site-health scoring',
        body: 'A health score surfaces the state of a site\'s internal-linking structure, turning an invisible problem into a number an operator can watch improve.',
      },
      {
        title: 'Zero manual work',
        body: 'The whole flow — keyword-to-URL mapping, relevance scoring, and link placement — is automated inside a native WordPress admin, so the structure builds itself.',
      },
    ],
    features: [
      { title: 'Keyword → URL mapping', desc: 'Maps the phrases that matter to the pages that should rank for them.' },
      { title: 'TF-IDF analysis', desc: 'Scores relevance properly instead of matching strings, so links land where they help.' },
      { title: 'Site health score', desc: 'Quantifies the internal-linking health of the whole site at a glance.' },
      { title: 'Six AI providers', desc: 'Provider-agnostic suggestions rather than lock-in to one model.' },
      { title: 'Automated placement', desc: 'Builds the internal-link structure with no manual editing pass.' },
      { title: 'WordPress-native admin', desc: 'Lives where the content already does — inside the WordPress dashboard.' },
    ],
    outcomes: [
      { metric: '6', label: 'AI providers, no single-vendor bet' },
      { metric: 'Automated', label: 'internal linking end-to-end' },
      { metric: 'Scored', label: 'site health, not a black box' },
      { metric: 'Zero', label: 'manual linking work' },
    ],
    lessons: [
      'Automate the high-value chore. Internal linking is neglected precisely because it is tedious — which makes it the perfect thing to automate.',
      'Relevance has to be measured, not guessed. TF-IDF turns "this looks related" into a score you can act on.',
      'Stay provider-agnostic. Supporting six AI backends keeps the plugin useful regardless of which one a site owner prefers or can afford.',
    ],
  },

  // ────────────────────────────────────────────────────────────
  //   SEO SKILLS FOR AI AGENTS
  // ────────────────────────────────────────────────────────────
  {
    slug: 'seo-skills-for-ai-agents',
    name: 'SEO Skills for AI Agents',
    url: 'https://github.com/magnetoid/seo-skills-for-ai-agents',
    year: '2026',
    category: 'Marketing · AI SEO',
    accent: '#22C55E',
    tagline: 'Expert-level technical SEO knowledge for AI coding assistants',
    hero: 'Stop fighting your AI when it writes bad, un-crawlable HTML. A pack of 14 skills that force any AI coding assistant to act as an expert technical SEO — every time.',
    summary:
      'SEO Skills for AI Agents is an open-source skill pack that gives AI coding assistants expert technical-SEO knowledge: semantic HTML, Core Web Vitals, structured data, E-E-A-T, JavaScript SEO, ecommerce, international, and AI search. Fourteen skills, aligned to Google Search Central, that drop into Cursor, Claude, Copilot, and other agents so the code they generate is crawlable and rankable by default.',
    role: 'SEO research, skill authoring, and multi-IDE packaging.',
    stack: [
      'Markdown skills',
      'Cursor / Claude / Copilot rules',
      'Google Search Central aligned',
      'MIT',
    ],
    stats: [
      { num: '14', label: 'expert SEO skills' },
      { num: 'Google', label: 'Search Central aligned' },
      { num: 'Multi-IDE', label: 'Cursor / Claude / Copilot / …' },
      { num: 'MIT', label: 'open source' },
    ],
    problem: {
      title: 'AI assistants write code that search engines cannot read',
      body: 'Coding assistants are happy to ship div soup, skip semantic structure, ignore Core Web Vitals, and forget structured data entirely — and they do it confidently. Developers end up fighting their own tools to get HTML that is actually crawlable, accessible, and rankable.',
    },
    approach: [
      {
        title: 'Codify expert SEO as agent skills',
        body: 'Rather than hoping the model remembers best practice, the knowledge is written as explicit skills the assistant must follow — turning "act as an expert technical SEO" from a wish into an enforced behavior.',
      },
      {
        title: 'Aligned to Google Search Central',
        body: 'The skills track Google\'s own published guidance, so the advice is grounded in the source of truth rather than folklore.',
      },
      {
        title: 'Cover the full 2026 surface',
        body: 'Semantic HTML, Core Web Vitals, structured data, E-E-A-T, JavaScript SEO, ecommerce, international, and AI search — the modern SEO surface, including being citable by AI answer engines.',
      },
      {
        title: 'Install anywhere an agent runs',
        body: 'Clone into a project, add as a git submodule, or pull with a one-liner, with config for whichever IDE or assistant a developer uses — the skills are tool-agnostic.',
      },
    ],
    features: [
      { title: 'Semantic HTML', desc: 'Forces correct, accessible, crawlable markup instead of div soup.' },
      { title: 'Core Web Vitals', desc: 'Bakes performance budgets and CWV awareness into generated code.' },
      { title: 'Structured data', desc: 'Proper JSON-LD so pages are eligible for rich results and AI citation.' },
      { title: 'E-E-A-T & JS SEO', desc: 'Guidance on trust signals and rendering so JavaScript apps stay indexable.' },
      { title: 'Ecommerce & international', desc: 'Catalog, hreflang, and multi-market patterns done correctly.' },
      { title: 'Multi-IDE install', desc: 'Clone, submodule, or one-liner — wired for Cursor, Claude, Copilot, and more.' },
    ],
    outcomes: [
      { metric: '14', label: 'skills enforcing expert SEO' },
      { metric: 'By default', label: 'crawlable, rankable output' },
      { metric: 'Any', label: 'AI assistant or IDE' },
      { metric: 'Aligned', label: 'to Google Search Central' },
    ],
    lessons: [
      'Encode the standard so the model cannot drift from it. An explicit skill beats hoping an assistant remembers best practice.',
      'Anchor to the source of truth. Aligning to Google Search Central keeps the guidance defensible instead of anecdotal.',
      'SEO in 2026 includes AI answer engines. Being citable by them is now part of the same job as ranking in classic search.',
    ],
  },
]

export function getProjectBySlug(slug: string): CaseStudyData | undefined {
  return CASE_STUDIES.find(p => p.slug === slug)
}

const MARKETING_SLUGS = new Set(['wp-interlinking', 'seo-skills-for-ai-agents'])

export function caseStudyTrack(study: CaseStudyData): CaseStudyTrack {
  return MARKETING_SLUGS.has(study.slug) ? 'marketing' : 'build'
}

export function findCaseStudy(slug: string | undefined): CaseStudyData | undefined {
  return CASE_STUDIES.find((s) => s.slug === slug)
}
