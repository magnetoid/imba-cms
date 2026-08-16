# Platform Wiring: Seeds, i18n, Theme, Users, Delivery

This document describes the slice that connected contract surfaces the kernel
declared but never called, and the features built on top of them.

## What was unwired, and how it is wired now

| Surface | Before | Now |
| --- | --- | --- |
| `Plugin.seed` | Implemented by pages, projects, site and blog; called by nothing. | `seedPlugins()` in core; every instance exposes `seed()` / `seedablePlugins`; the admin dashboard shows a **Setup** panel to `settings.manage` holders that runs it and reports per-plugin results. |
| `Plugin.i18n` + `initI18n` | Exported, never invoked. | The registry collects strings per locale, namespaced by plugin name; the boot path loads them into i18next (idempotently). `useTranslation('<plugin>')` works in any plugin component. |
| Site plugin published settings | Written by the Site admin, read by nobody. | New `Plugin.resolveTheme(ctx)` hook. `ThemeProvider` resolves all hooks after mount and merges them over template defaults and `site.theme`. plugin-site maps its published row; plugin-pages publishes the home hero; plugin-projects publishes the selected-work grid. |
| template-cinema | Hardcoded nav/footer/home copy; linked to `/work`, `/services`, `/about`, `/contact` which did not exist. | Reads everything from `useThemeConfig()` (its own copy is `theme.defaults`); renders `/about`, `/services`, `/contact` from plugin-pages and `/work`, `/work/:slug` from plugin-projects; applies each record's SEO fields. `expects: ['blog', 'pages', 'projects']`. |
| `users.manage` + `cms_user_roles` | Table and capability existed; roles could only be edited in the database console. | settings-server `/api/users` endpoints + `@imba/plugin-users` admin page (System → Users): list accounts, assign/remove roles, invite by email. |
| Delivery API | Blog only. | `/api/content/pages[/:slug]`, `/api/content/projects[/:slug]`, `/api/content/site`; pages/projects/site plugins gain HTTP public clients selected by `IMBA_CONTENT_API_URL`. |
| MCP server | Blog only. | `pages_*`, `projects_*`, `site_*` tools, capability-gated; default allowlist covers every content plugin. |

## Theme layering

`ThemeProvider` merges, lowest precedence first:

1. derived from `SiteConfig` (name, domain, contact email, social)
2. `template.theme.defaults`
3. `site.theme` (code-level override in the app)
4. each plugin's `resolveTheme()` result, in plugin dependency order

Runtime (4) wins because it is what an editor controls. Until resolvers settle
the static merge renders; a rejected resolver is logged and ignored.

Templates should treat every theme field as optional and ship their own copy as
`theme.defaults` (see `packages/template-cinema/src/themeDefaults.ts`).

## Seeding

Seeds are idempotent by convention: each plugin checks for existing rows first.
The runner continues past a failing plugin and reports `{ plugin, status, error }`
per entry. RLS still applies — a plugin whose rows the caller may not insert
shows up as that plugin's failure line. Seeding cannot run from the `imba` CLI
because plugin modules import Vite-only `?raw` SQL; use the admin panel.

## Users and roles

settings-server (service role) exposes, gated on `users.manage`:

- `GET /api/users` — GoTrue users joined with `cms_user_roles`
- `PUT /api/users/:id/role` — `{ role: <CmsRole> | null }`; `409` if it would remove the last `super_admin`
- `POST /api/users/invite` — `{ email, role }`; sends a GoTrue invite, records the role; `IMBA_INVITE_REDIRECT_URL` sets the redirect

Role changes clear the server's token→subject cache so they take effect on the
next request. `@imba/plugin-users` defaults to a same-origin `/api/users` and
can be pointed elsewhere with the runtime value `IMBA_USERS_API_URL`.

## Runtime values

| Key | Read by | Effect |
| --- | --- | --- |
| `IMBA_CONTENT_API_URL` | blog, pages, projects, site plugins | Use the delivery API instead of Supabase in the browser. |
| `IMBA_USERS_API_URL` | plugin-users | Base URL of the users API (default `/api/users`). |
| `IMBA_INVITE_REDIRECT_URL` | settings-server | Redirect for invitation links. |
| `IMBA_MCP_ALLOWED_CAPABILITIES` | plugin-mcp | Narrow the tool allowlist. |
