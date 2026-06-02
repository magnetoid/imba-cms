// Starter blog posts for @imba/plugin-blog. Seedable from /admin/blog (one
// click) and from the plugin `seed()` hook, so the public /blog page has real
// content immediately. Each entry maps directly onto the blog_posts columns
// defined in migrations/V001_blog.sql (title, slug, excerpt, body, category,
// tags, read_time_minutes, published, status, published_at).
//
// Body is stored as HTML (matches Tiptap's output). The public BlogPost.tsx
// renders via dangerouslySetInnerHTML, so the same content opens in the editor
// without `## Heading` showing as literal characters.
//
// Heading hierarchy per SEO best practice:
//   <h1> is the post title (rendered by BlogPost.tsx, NOT inside body)
//   <h2> is each main section here
//   <h3> can nest under <h2> when an admin elaborates
//   <h4> for the deepest detail

export interface SeedPost {
  title: string
  slug: string
  excerpt: string
  body: string
  category: string
  tags: string[]
  read_time_minutes: number
  published: boolean
  status: 'draft' | 'published' | 'scheduled'
  published_at: string // ISO date
}

function body(intro: string, sections: { h: string; p: string }[]): string {
  return [
    `<p>${intro}</p>`,
    ...sections.flatMap(s => [`<h2>${s.h}</h2>`, `<p>${s.p}</p>`]),
    `<hr>`,
    `<p><em>This is a starter body. Edit it from the admin to publish the full article.</em></p>`,
  ].join('\n')
}

export const SEED_POSTS: SeedPost[] = [
  {
    title: 'How to Explode Your Sales Using AI Video: The Ultimate Guide for 2026',
    slug: 'ai-video-sales-guide-2026',
    excerpt: 'AI video outreach gets 2–3× more response rates than plain text. Discover the exact workflow we use to produce AI-powered video campaigns that convert.',
    category: 'AI Video',
    read_time_minutes: 9,
    published: true,
    status: 'published',
    published_at: '2026-03-08T00:00:00Z',
    tags: ['AI', 'Sales', 'Video Marketing'],
    body: body(
      'AI video isn\'t a gimmick anymore. It\'s the highest-leverage channel for outbound sales in 2026 — quietly outperforming static images and plain-text email by margins big enough to rewrite your pipeline math.',
      [
        { h: 'Why AI video converts', p: 'Personalisation at scale, scene control that was impossible last year, and creative iteration measured in hours not weeks.' },
        { h: 'The workflow we use', p: 'Script → AI-augmented production → human direction → A/B test variants → ship the winners.' },
        { h: 'Real-world numbers', p: 'Clients running personalised AI video in outbound see 2–3× response rates and meaningfully shorter sales cycles.' },
      ],
    ),
  },
  {
    title: 'How to Generate Sales with Video Products: A Comprehensive Guide',
    slug: 'generate-sales-video-products',
    excerpt: 'Product videos increase conversions by up to 80%. This guide covers every type of product video — from demos to testimonials — and when to use each.',
    category: 'Video Production',
    read_time_minutes: 8,
    published: true,
    status: 'published',
    published_at: '2025-03-30T00:00:00Z',
    tags: ['Product Video', 'Ecommerce', 'Conversion'],
    body: body(
      'If your product page still leads with stills, you\'re leaving money on the table. Conversion data from across DTC, Amazon, and Shopify storefronts consistently points the same direction: shoppers who watch video buy more.',
      [
        { h: 'Demo videos', p: 'Show the one thing your product does better than anyone else. 30 seconds max.' },
        { h: 'Lifestyle videos', p: 'Anchor the product in the moment the buyer wants to live. Aspirational without being unreachable.' },
        { h: 'Testimonial videos', p: 'Real customers, real specifics, real numbers. The highest-trust content you can produce.' },
      ],
    ),
  },
  {
    title: 'The Impact of AI on Video Production in 2025',
    slug: 'ai-impact-video-production-2025',
    excerpt: 'From automated editing and AI avatars to generative B-roll — how AI is fundamentally changing what\'s possible in video production, and how to stay ahead.',
    category: 'AI Video',
    read_time_minutes: 7,
    published: true,
    status: 'published',
    published_at: '2025-01-13T00:00:00Z',
    tags: ['AI', 'Industry'],
    body: body(
      'The toolset crossed a threshold in 2024. What was experimental last year is now in production pipelines at studios serious about staying current.',
      [
        { h: 'Automated editing', p: 'AI-driven rough cuts and scene selection collapse the first 40% of post-production into an afternoon.' },
        { h: 'AI avatars', p: 'Photorealistic presenters that speak any language, available 24/7. Ideal for explainers and training.' },
        { h: 'Generative B-roll', p: 'Scenes a camera couldn\'t capture — at a fraction of the location cost.' },
      ],
    ),
  },
  {
    title: 'Going Viral: Strategies for eCommerce Brands on TikTok',
    slug: 'tiktok-ecommerce-viral-strategies',
    excerpt: 'TikTok drives billions in ecommerce sales. Learn the content formats, posting cadences, and production techniques that actually lead to viral product videos.',
    category: 'TikTok',
    read_time_minutes: 6,
    published: true,
    status: 'published',
    published_at: '2024-12-25T00:00:00Z',
    tags: ['TikTok', 'Social', 'Ecommerce'],
    body: body(
      'Going viral is rarely an accident. The brands consistently winning on TikTok run a content system, not a content lottery.',
      [
        { h: 'Format', p: 'Hook in the first 1.5 seconds, payoff before second 8, CTA in the last quarter.' },
        { h: 'Cadence', p: 'Three native posts a week, always testing one new hook against your proven winner.' },
        { h: 'Production', p: 'Phone-native framing, captions baked in, sound designed for muted feed scrolling.' },
      ],
    ),
  },
  {
    title: 'How to Generate Website Traffic with Video SEO in 2025',
    slug: 'video-seo-traffic-2025',
    excerpt: 'YouTube is the world\'s second-largest search engine. A practical guide to optimising your video content for discovery, featuring our exact keyword strategy.',
    category: 'Video Production',
    read_time_minutes: 7,
    published: true,
    status: 'published',
    published_at: '2024-10-28T00:00:00Z',
    tags: ['SEO', 'YouTube'],
    body: body(
      'Video SEO is a discipline of its own — closer to search marketing than to film-making — and most brands underinvest by an order of magnitude.',
      [
        { h: 'Keyword strategy', p: 'Pick the question your customer is typing into YouTube. Answer it directly in the first 30 seconds.' },
        { h: 'Metadata', p: 'Title, description, tags, transcript, and chapter markers. All of them. Every time.' },
        { h: 'Thumbnails', p: 'Custom thumbnails outperform auto-generated ones by 2–3× on click-through.' },
      ],
    ),
  },
  {
    title: 'Transforming Views into Sales: The Power of Shoppable Video',
    slug: 'shoppable-video-sales',
    excerpt: 'Shoppable video bridges the gap between content and commerce. A complete breakdown of the technology, platforms, and creative approach that converts viewers into buyers.',
    category: 'AI Video',
    read_time_minutes: 5,
    published: true,
    status: 'published',
    published_at: '2024-09-22T00:00:00Z',
    tags: ['Shoppable', 'Ecommerce'],
    body: body(
      'Shoppable video is the single biggest unlock for ecommerce brands in the next 24 months. Watching becomes buying without leaving the feed.',
      [
        { h: 'The technology', p: 'Native shoppable tags on TikTok, Instagram, YouTube, and most major DTC platforms.' },
        { h: 'The creative', p: 'Lead with the hero shot. Surface the price and CTA at the moment of peak interest, not the start.' },
        { h: 'The numbers', p: 'Average lift in conversion vs. static product pages: 30-80% depending on category.' },
      ],
    ),
  },
  {
    title: 'TikTok Success: A Step-by-Step Guide to Shooting Engaging Brand Videos',
    slug: 'tiktok-brand-video-guide',
    excerpt: 'Production tips, creative formats, and the exact shooting checklist we use to produce TikTok content that consistently outperforms clients\' existing organic reach.',
    category: 'TikTok',
    read_time_minutes: 6,
    published: true,
    status: 'published',
    published_at: '2024-09-21T00:00:00Z',
    tags: ['TikTok', 'Production'],
    body: body(
      'Most "TikTok content" is repurposed landscape video with a vertical crop. Native-shot content outperforms it by a wide margin every single time.',
      [
        { h: 'Pre-production', p: 'Hook list, ten variants, ranked by predicted performance. Decide before you roll.' },
        { h: 'Shoot day', p: 'Vertical framing, natural light if possible, lav mic always. One performer, one idea per take.' },
        { h: 'Post', p: 'Cut on the beat. Captions are non-negotiable. Export in 1080×1920 at 60fps when the source allows.' },
      ],
    ),
  },
  {
    title: 'Why User-Generated Content is Revolutionizing Digital Marketing',
    slug: 'ugc-digital-marketing',
    excerpt: 'UGC converts at 4× the rate of brand-produced content. Here\'s how to brief, direct, and edit UGC-style videos that feel authentic and drive real results.',
    category: 'Video Production',
    read_time_minutes: 5,
    published: true,
    status: 'published',
    published_at: '2024-09-20T00:00:00Z',
    tags: ['UGC', 'Authenticity'],
    body: body(
      'UGC is misunderstood. The "user-generated" label suggests it\'s amateur — but the best-performing UGC is carefully briefed, lightly directed, and edited with intent.',
      [
        { h: 'Brief well', p: 'Constraints unlock creativity. Tell the creator what to talk about, not how.' },
        { h: 'Direct lightly', p: 'Give a hook prompt and a payoff prompt. Let the middle be theirs.' },
        { h: 'Edit honestly', p: 'Keep the awkward pause that lands. Remove the jump cut that fights the rhythm.' },
      ],
    ),
  },
  {
    title: 'Unleash Creativity: Master Micro Drama in Video Production',
    slug: 'micro-drama-video-production',
    excerpt: 'Micro-dramas are exploding on every platform. A deep dive into the format, storytelling structure, and production workflow that makes these short films so addictive.',
    category: 'Film',
    read_time_minutes: 6,
    published: true,
    status: 'published',
    published_at: '2024-10-27T00:00:00Z',
    tags: ['Micro Drama', 'Storytelling'],
    body: body(
      'Micro-drama is the most interesting narrative format to emerge in years. Two-minute episodes, cliff-hangers stacked end to end, designed for a phone-first audience.',
      [
        { h: 'Story structure', p: 'A hook every 15 seconds, a turn every 45, an episode-ending hook every 90.' },
        { h: 'Production', p: 'Tight budgets force creative constraints. Three locations, two leads, daylight only.' },
        { h: 'Distribution', p: 'Vertical-native, multi-platform, optimised for binge-watching from a feed click.' },
      ],
    ),
  },
  {
    title: 'Exploring the Latest Advances in 4K and 8K Video Technology',
    slug: '4k-8k-video-technology',
    excerpt: 'How the latest camera technology is changing what\'s possible in commercial production — and how we use it to deliver broadcast-quality footage for brand campaigns.',
    category: 'Technology',
    read_time_minutes: 6,
    published: true,
    status: 'published',
    published_at: '2025-02-24T00:00:00Z',
    tags: ['4K', '8K', 'Technology'],
    body: body(
      'Resolution alone isn\'t the story. Dynamic range, latitude, and high-frame-rate capture are where 8K cameras quietly change what\'s shootable.',
      [
        { h: 'When to shoot 8K', p: 'Crops, reframes, and stabilisation that would degrade lower-resolution footage stay clean.' },
        { h: 'When 4K is enough', p: 'Most social and broadcast finishes happily at 4K — and 8K storage costs add up fast.' },
        { h: 'The future', p: 'Computational pipelines + AI upscaling are erasing the 4K-vs-8K decision for most use cases.' },
      ],
    ),
  },
  {
    title: 'The Rise of AI in Video Production: A 2024 Perspective',
    slug: 'ai-video-production-2024',
    excerpt: 'A comprehensive look at how AI tools — Runway, Sora, Stable Diffusion — are reshaping production pipelines and what it means for brands and agencies.',
    category: 'AI Video',
    read_time_minutes: 8,
    published: true,
    status: 'published',
    published_at: '2025-01-13T00:00:00Z',
    tags: ['AI', 'Runway', 'Sora'],
    body: body(
      '2024 was the year generative video stopped being a demo and started shipping in client work. Every studio we know is now running some version of an AI-augmented pipeline.',
      [
        { h: 'Runway', p: 'Versatile, controllable, integrates cleanly with NLE workflows.' },
        { h: 'Sora', p: 'Best-in-class for one-shot generations with cinematic quality. Slower iteration loop.' },
        { h: 'Stable Diffusion', p: 'The open-source backbone. Endless plugins, models, and ControlNets.' },
      ],
    ),
  },
  {
    title: 'Unleashing Future Visions: Generative AI Video 2025',
    slug: 'generative-ai-video-2025',
    excerpt: 'Generative AI video has crossed the uncanny valley. How we\'re integrating tools like Sora into real client productions — and the results we\'re seeing.',
    category: 'AI Video',
    read_time_minutes: 7,
    published: true,
    status: 'published',
    published_at: '2024-10-12T00:00:00Z',
    tags: ['Generative AI', 'Sora'],
    body: body(
      'The uncanny valley is officially behind us for short-form work. The frontier now is character consistency and complex camera movement — and both are advancing fast.',
      [
        { h: 'Where generative AI works today', p: 'B-roll, environmental shots, otherwise-impossible scenes, rapid concept testing.' },
        { h: 'Where it still struggles', p: 'Tight character consistency across shots, complex dialogue scenes, hands.' },
        { h: 'What this means for clients', p: 'Production budgets stretch further. Creative options multiply. Lead times shrink.' },
      ],
    ),
  },
]
