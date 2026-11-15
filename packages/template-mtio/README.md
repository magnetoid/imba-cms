# @imba/template-mtio

Public template for mtiosavljevic.com.

## Structure

The site has two halves, mirrored by the two nav menus:

| Menu | Pages |
|---|---|
| Build & Research | `/research`, `/systems`, `/projects`, `/projects/:slug` |
| Marketing & Services | `/services`, `/results`, `/approach` |

Plus `/` (home), `/contact`, and the Journal (`/blog`, from plugin-blog).

## Where the copy lives

All copy is hardcoded in `src/data/` for now:

- `site.ts` — menus, contact links, headline proof numbers, client names
- `services.ts` — services, typical engagements, the five steps, principles
- `case-studies.ts` — the 12 case studies (carried over from the old site)
- `research.ts`, `systems.ts` — research areas and systems (carried over)

Every figure comes from Marko's public Upwork profile or the previous live
site. Do not add client results that are not sourced.

## Notes for the CMS work

These were worked around inside the template and are better solved in core:

1. **Content is not editable.** `src/data/*` should move behind plugin-site /
   plugin-pages / plugin-projects.
2. **A page cannot own its SEO.** `PublicRouteElement` sets the title from the
   route's static `seo`, and its effect runs after the page's. `ProjectPage`
   defers its own title by a tick (`useCaseStudySeo`).
3. **`cine.*` colors take no opacity modifier.** They are bare CSS variables,
   so `bg-cine-bg/80` generates no CSS. The template uses plain rules in
   `tokens.css` (`.mt-header-solid`, `.mt-tint`, `.mt-card`) instead.
4. **No scroll handling on navigation.** `PublicLayout` scrolls to top, or to
   the `#hash` target, on every route change.
5. **No contact form.** `/contact` links to email and Upwork; a form needs a
   backend endpoint.
