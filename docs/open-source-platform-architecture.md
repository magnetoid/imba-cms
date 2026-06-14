# Open-Source Platform Architecture

## Goals

- Keep the CMS open source and self-hostable.
- Make upgrades predictable and safe for production content systems.
- Support a real theme system with a separate public frontend.
- Support a stronger plugin system with compatibility metadata and lifecycle rules.

## Product Shape

Use one monorepo with multiple deployable apps and shared packages.

### Target apps

- `apps/cms`
  - Admin UI
  - Internal CMS APIs
  - Plugin admin surfaces
  - Migrations runner entrypoints
- `apps/theme`
  - Public website
  - Theme rendering
  - Content delivery client
  - Preview-safe public routes
- `packages/settings-server`
  - Fold into `apps/cms` over time, unless it is intentionally kept as a separate internal API service

### Shared packages

- `packages/core`
  - Auth, capabilities, plugin contracts, registry, migrations
- `packages/plugin-*`
  - Content features, admin modules, delivery modules, automation modules
- `packages/template-*`
  - Theme packages with public layouts, routes, slots, and styling
- `packages/ui`
  - Shared design system

## Deployment Model

The best long-term production setup is:

- Container 1: `cms`
- Container 2: `theme`
- Managed backend services:
  - Supabase / Postgres
  - Storage
  - Optional Redis / queue

This keeps the platform open source while allowing independent scaling and safer rollouts.

## Update Strategy

Do not let production CMS containers update themselves in place.

Use this flow instead:

1. Renovate opens dependency and image update PRs.
2. CI runs tests, typecheck, build, and migration safety checks.
3. Staging deploy runs automatically.
4. Production deploy happens from Git after approval.
5. Database snapshot happens before destructive schema changes.
6. Rollback happens by Git revert or deployment history rollback.

### Why

- CMS releases often include schema changes.
- A self-updating live container can break the app/schema contract with no safe gate.
- Git-based promotion keeps updates auditable and reproducible for open-source users.

### Recommended tooling

- `Renovate` for dependency and image update PRs
- `Helm + Flux` or `Helm + Argo CD` for GitOps deployments
- `DIUN` only for image notifications, not direct live mutation

## Theme System

Themes should be first-class packages, not hardwired inside the admin app.

### Theme package responsibilities

- Provide `PublicLayout`
- Provide public routes
- Declare supported CMS/plugin capabilities
- Expose theme slots and override points
- Consume a content delivery client, not direct CMS bootstrap state

### Required refactor

- Split current single-app router into:
  - `createAdminApp()`
  - `createPublicApp()`
- Remove direct public dependence on CMS bootstrap singletons
- Move public blog access from direct browser Supabase access to a delivery client
- Replace hardcoded public brand URLs and dead links with theme-config or CMS-managed values

## Plugin System

Plugins should carry compatibility metadata and lifecycle guarantees.

### Required plugin metadata

- `name`
- `version`
- `dependsOn`
- `compatibility.coreVersion`
- `compatibility.pluginApiVersion`
- `peerPlugins`
- `provides`
- `requires`
- runtime targets:
  - `admin`
  - `public`
  - `server`

### Runtime requirements

- Validate plugin compatibility before boot
- Initialize plugins in dependency order
- Preserve registry provenance for routes, nav items, widgets, and slots
- Enforce template expectations against installed plugins
- Keep permissions declarative at plugin contribution boundaries

## Recommended Implementation Order

1. Finish MCP capability hardening
2. Split admin/public app composition
3. Decouple public content delivery from direct browser DB access
4. Add plugin compatibility metadata and dependency-ordered initialization
5. Add theme packages with slot/override APIs
6. Add deployment artifacts:
   - Dockerfiles
   - Helm chart or Compose stack
   - Renovate config
   - upgrade and rollback runbook

## Update Policy For Open-Source Users

- Patch and minor updates should be easy to adopt from tagged releases.
- Every release should include:
  - changelog
  - migration notes
  - compatibility notes
  - rollback notes
- Breaking upgrades should ship with:
  - migration guide
  - deprecation period
  - schema compatibility notes

## Current Decision

The platform should evolve toward:

- one open-source monorepo
- two primary containers
- Git-driven updates
- package-based themes
- compatibility-aware plugins

That gives the best balance of open-source flexibility, safe upgrades, and professional CMS architecture.
