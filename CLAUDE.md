# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

IMBA CMS: an open-source, self-hostable CMS built as a pnpm + Turborepo monorepo. Supabase/Postgres is the backend; React 18 + react-router 6 + Vite on the front. A small kernel (`@imba/core`) composes **plugins** (content features) and a **template** (public theme) into an admin app and/or a public site. Authorization is a capability model enforced twice: in TypeScript for the admin UI, and in Postgres RLS for real.

## Commands

Node 22 (`.nvmrc`), pnpm 10. Run `pnpm install` first.

```bash
pnpm build          # turbo run build (only packages with a build script: core/node, cli, plugin-mcp, settings-server, apps)
pnpm typecheck      # turbo run typecheck
pnpm test           # turbo run test --concurrency=4  (unit; no DB needed)
pnpm test:int       # integration tests against real Postgres (see below)
pnpm dev            # all dev servers
```

Per-package (preferred while iterating):

```bash
pnpm --filter @imba/core test                          # one package's suite
pnpm --filter @imba/core vitest run src/define.test.ts # one file
pnpm --filter @imba/core vitest run -t "orders plugins" # one test by name
pnpm --filter @imba/plugin-blog typecheck
pnpm --filter imba-cms-admin dev                       # admin app, http://localhost:3001 (built under /admin/)
pnpm --filter imbaproduction dev                       # public site + /admin, http://localhost:3000
```

Gotchas:
- `@imba/core/node` is a **built** entry (`dist/node.js`). Running `tsc`/`typecheck` directly inside `plugin-mcp`, `settings-server` or `cli` fails with "Cannot find module '@imba/core/node'" until you run `pnpm --filter @imba/core build`. Turbo does this for you (`dependsOn: ^build`); a bare `pnpm --filter <pkg> typecheck` does not.
- `pnpm lint` is declared in package.json scripts but **eslint is not installed** in this repo; the script fails. Don't rely on it.
- `pnpm test` intentionally caps concurrency (`--concurrency=4`) and each package's vitest pool at 2 threads (`vitest.shared.ts`) — many packages spin up jsdom and unbounded workers made unrelated packages time out. Keep both caps.
- Integration tests: `IMBA_TEST_DATABASE_URL=postgres://localhost:5432/imba_cms_test pnpm test:int` (package `@imba/db-testkit`). They **drop and recreate `public` and `auth`** on that database on every file, so point it at a throwaway DB. Without the env var they are skipped, not failed. `fileParallelism: false` there is required, not tuning.
- Test-file default environment is per-package (`jsdom` for React packages, `node` for cli/mcp/settings-server). Override per file with `// @vitest-environment node` at the top; SQL/migration tests do this. `template-cinema` stubs `IntersectionObserver` in `vitest.setup.ts` for framer-motion.
- settings-server caches bearer-token → subject for 30s process-wide; tests that reuse a token with different permissions must `clearServerSubjectCache()` (see `server.test.ts`).

## Architecture

### The kernel: `packages/core`

- `types.ts` — the plugin/template contract. A `Plugin` declares `name`, `version`, optional `dependsOn`, `tablePrefix`, public `routes`, `admin: { nav, pages }`, `migrations: [{ id: 'blog.V001', sql }]`, `dashboard` widgets, `i18n`, `seed(ctx)`, `register(ctx)`, `resolveTheme(ctx)`. A `Template` declares `layouts.Public`, `pages`, `expects` (plugin names it requires), and theme defaults/slots.
- `createCMS.tsx` — the single boot path (`initializeCmsRuntime`): `assertValidCmsConfig` (zod, `config.ts`) → `buildRegistry` (`registry.ts`: `validatePlugins` + Kahn topo-sort by `dependsOn`, route/nav/tablePrefix collision checks, i18n bundle, theme resolvers) → `createDb`/`createAuth` → `initI18n` → call every plugin's `register(ctx)` in dependency order. Three entry points share it: `createCMS` (admin at `/admin/*` + public), `createAdminApp`, `createPublicApp`. All return `migrations = [...CORE_MIGRATIONS, ...registry.migrations]`, plus `seed()` / `seedablePlugins` (the plugin `seed` hooks; the admin dashboard's Setup panel runs them for `settings.manage`).
- `theme.tsx` — `ThemeProvider` merges derived-from-site → `template.theme.defaults` → `site.theme` → each plugin's `resolveTheme(ctx)` (runtime, wins). Templates must treat every field as optional and ship their copy as `theme.defaults`. See `docs/platform-wiring.md`.
- `CORE_MIGRATIONS` in `createCMS.tsx` is a hand-maintained ordered list; adding a `migrations/V00N_*.sql` file without registering it there does nothing. `manifest.ts#composeMigrations(plugins)` is the tooling-side source of the same ordered list (CLI, db-testkit).
- `permissions.ts` — `CMS_CAPABILITIES` (dotted strings like `blog.write.any`), `ROLE_CAPABILITIES` (six roles: super_admin, content_admin, editor, author, reviewer, media_manager), `resolveCapabilities` = role set ∪ explicit `app_metadata.permissions` grants from the JWT. `AdminShell.tsx` filters nav/pages/widgets by `requiredCapabilities` and refuses entry via `hasAdminAccess`.
- `node.ts` → `@imba/core/node`: React-free, `?raw`-free re-exports for server processes. The main entry imports `.sql?raw` (Vite-only), so **anything that runs under plain Node must import from `@imba/core/node`**, and nothing added to `node.ts` may pull React or `?raw` back in (the build is the guard).

### Plugins (`packages/plugin-*`)

Each is `definePlugin({...})` as the default export, with `admin/` (lazy-loaded React pages), `public/` (routes + a `*Client.ts` data client set via `register(ctx)` — Supabase by default, an HTTP client over the delivery API when `IMBA_CONTENT_API_URL` is set), `migrations/*.sql` imported with `?raw` (each package carries its own `sql.d.ts` for that), and `types.ts`. Tables are prefixed by `tablePrefix` (`blog_`, `pages_`, …). `plugin-settings` and `plugin-users` are different: no tables; they talk to `@imba/settings-server` over HTTP (`/api/settings`, `/api/users`) using the Supabase access token.

`template-cinema` renders `/about`, `/services`, `/contact` from plugin-pages and `/work`, `/work/:slug` from plugin-projects (`expects: ['blog','pages','projects']`), and reads brand/nav/footer/home copy from `useThemeConfig()`.

### Server-side packages (plain Node, import `@imba/core/node`)

- `settings-server` — small HTTP server: `/api/settings/{graphql,mcp}` (+`/test`), `/api/users` (+`/:id/role`, `/invite`; gated on `users.manage`, refuses to remove the last super_admin), public delivery `/api/content/{blog/posts,pages,projects,site}[/:slug]`, `/api/content/blog/preview-token`. Uses the **service-role key**; CORS must be configured explicitly (`IMBA_SETTINGS_CORS_ORIGIN`, or `IMBA_ALLOW_WILDCARD_CORS=1`). See `docs/content-delivery-and-preview.md`, `docs/platform-wiring.md`.
- `plugin-mcp` — MCP server (`imba-mcp` bin; stdio or `--http`), service-role client, capabilities restricted via `IMBA_MCP_ALLOWED_CAPABILITIES`; entities in `src/entities/` (`blog.ts`, `content.ts` for pages/projects/site).
- `cli` — `imba update|doctor`: the update engine for downstream projects. Only touches MANAGED packages (`@imba/core`, `@imba/ui`, `@imba/tailwind-preset`, `@imba/plugin-*`, `@imba/template-*`); migrations must be additive unless `--force` (`safety.ts` scans for destructive SQL — the idempotent `drop policy if exists / create policy` idiom is deliberately *not* destructive).

### Apps

`apps/cms` = `createAdminApp` with all plugins incl. settings + users (served under `/admin/`, port 3001). `apps/imbaproduction` = `createCMS` with `template-cinema` + blog, media, pages, projects, site (port 3000). Browser config comes from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_SITE_URL`, optionally overridden at runtime by `window.__IMBA_RUNTIME_CONFIG__` (`readBrowserRuntimeValue`). Missing URL/anon key fails at boot by design — don't reintroduce placeholder fallbacks.

## Authorization: the rule that matters most

The capability table exists in two places that **must agree**:
1. `packages/core/src/permissions.ts` (`ROLE_CAPABILITIES`) — what the admin UI shows.
2. `packages/core/src/migrations/V006_capabilities.sql` (`role_capabilities()` as a `CASE`, `has_capability()`) — what RLS allows.

`V006_capabilities.test.ts` parses the SQL CASE arms and asserts set-equality with the TS table. When adding a capability or changing a role: update both, add a new additive core migration if the SQL changes (do not edit an applied `V00N` file), register it in `CORE_MIGRATIONS`, and gate the new plugin RLS policies on `has_capability('x.y')` (not `is_admin()`, which since V005 resolves only super_admin and the JWT admin markers). Publishing that must change status without allowing body edits goes through a `security definer` function (see blog `V003`), because RLS gates rows, not columns.

Migration tests are of two kinds: `*.sql` text assertions (`expect(sql).toMatch(...)`, unit, everywhere) and executed assertions in `packages/db-testkit/src/*.int.test.ts` against real Postgres with a Supabase shim (`supabase-shim.sql`, which lives outside any `migrations/` dir on purpose). Behavior changes to RLS should get an int test; text tests alone pass on SQL that never runs.

## Conventions worth knowing

- Migration ids are namespaced `'<plugin>.V00N'`; within a plugin they are sorted by id, across plugins by dependency order. Duplicate ids throw.
- No secrets in browser bundles: `plugin-blog/src/no-browser-secrets.test.ts` greps the source for LLM keys / `localStorage`. Anything needing a privileged key belongs in `settings-server` or `plugin-mcp`.
- Files carry long explanatory header comments describing *why* (often the bug that motivated the code). Keep that style; commits are Conventional Commits (`feat(plugin-blog): …`, `fix(core,mcp): …`).
- `docs/` holds architecture direction and roadmap dossiers (`open-source-platform-architecture.md` is the "current decision" doc); they describe intent, not necessarily what's implemented — check code first.
