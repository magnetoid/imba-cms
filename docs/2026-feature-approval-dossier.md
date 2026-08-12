# IMBA CMS 2026 Feature Approval Dossier

## Executive Summary

This dossier summarizes a static and dynamic analysis of the current IMBA CMS codebase and proposes a prioritized set of industry-aligned features for approval before implementation.

The codebase is structurally promising: it already has a plugin-oriented kernel, migration ordering, typed contracts, a blog plugin, a settings server, and an MCP integration surface. The main constraint is not lack of code structure. It is product maturity. The current platform still relies on direct client-side database access for public delivery, has incomplete governance and editorial controls, and does not yet provide the release, media, and operational safety capabilities expected from a serious modern CMS.

My recommendation is to approve a focused first implementation tranche rather than all five proposals at once:

1. Secure Delivery API + Live Preview
2. Editorial Governance Suite
3. Media Library + Asset Pipeline

The remaining two proposals are strong follow-ons once the platform layer is safer:

4. Governed MCP Operations Center
5. Signed Release Automation + Update Control

## Analysis Method

### Static analysis

Reviewed core architectural and operational files including:

- `packages/core/src/createCMS.tsx`
- `packages/core/src/AdminShell.tsx`
- `packages/core/src/auth.ts`
- `packages/core/src/permissions.ts`
- `packages/plugin-blog/src/admin/BlogPostEdit.tsx`
- `packages/plugin-blog/src/public/blogClient.ts`
- `packages/plugin-blog/src/public/BlogPost.tsx`
- `packages/plugin-blog/src/migrations/V001_blog.sql`
- `packages/plugin-blog/src/migrations/V002_blog.sql`
- `packages/settings-server/src/server.ts`

### Dynamic analysis

Verified current runtime health with:

- workspace typecheck: passed
- `@imba/core` typecheck: passed
- `@imba/core` tests: 51/51 passed
- `@imba/plugin-settings` tests: 10/10 passed

Observations from runtime verification:

- the current codebase is stable enough for feature work
- there is no established e2e suite
- there is no benchmark/load-test harness in the repository

## Current Architecture

### Confirmed architectural patterns

1. Plugin-first CMS kernel
   - `createCMS()` composes plugins, routes, admin navigation, widgets, and migrations in a shared runtime.
2. Monorepo delivery model
   - apps + packages are separated cleanly, but public and admin concerns are still partially coupled.
3. Supabase-first persistence and auth
   - auth, RLS, and direct table access are central to the system.
4. Code-first feature expansion
   - content capabilities are introduced through plugins and migrations, not through a visual schema builder.

### Technical stack capabilities

- React 18
- TypeScript monorepo
- Vite
- Vitest
- Supabase auth + database
- SQL migrations with RLS
- MCP integration via `plugin-mcp`
- shared UI primitives in `packages/ui`

### Architectural strengths

- typed plugin contracts and route composition
- deterministic migration ordering
- modular package boundaries
- good editorial starting point in the blog plugin
- useful MCP foundation for AI-native workflows

## Key Bottlenecks And Gaps

### 1. Public delivery is still database-coupled

The blog public client queries Supabase directly from the application layer. That works for a single app, but it blocks proper cache control, tokenized preview, external client adoption, and standardized API contracts.

### 2. Editorial governance is partial

The codebase has workflow status values and even an audit/revisions migration in the blog plugin, but the platform does not yet offer a complete, approved editorial governance experience across UI, permissions, and operational reporting.

### 3. Media is not a first-class subsystem

Editors still work with image URLs rather than a governed media library with metadata, transforms, reuse, and validation.

### 4. RBAC is backend-first and incomplete in product terms

The branch has new RBAC groundwork, but the management experience, plugin-level consistency, and admin-facing user management flows are not complete.

### 5. Operational automation is currently unsafe

The current GitHub webhook implementation triggers `pnpm run build` directly and explicitly notes that signature verification is not implemented. That is not deployment-safe for production.

### 6. Output rendering has a content safety risk

The public blog page renders parsed HTML with `dangerouslySetInnerHTML`. That can be acceptable in a tightly controlled authoring environment, but it becomes a material risk once richer input sources, imports, or AI-assisted workflows expand.

### 7. Test strategy is missing two critical layers

- no browser e2e coverage
- no benchmark/load-testing framework

That means the requested 95%+ coverage target for new work is achievable only if new testing infrastructure is added alongside the features.

## Unmet User Needs

### Editors

- safe preview before publish
- reusable media workflows
- revision history and rollback
- review and approval visibility
- bulk operations and faster search

### Platform admins

- secure deployment/update controls
- role assignment UI
- better auditability
- standardized delivery surface for downstream apps

### Developers and integrators

- stable REST or GraphQL content API
- preview-safe content access
- webhooks and revalidation events
- stronger observability and predictable release flow

## Proposed Feature Set

## Feature 1: Secure Delivery API + Live Preview

### Why it matters

This is the highest-leverage platform feature. It decouples frontends from raw database access and makes the CMS truly headless.

### Industry alignment

Modern platforms such as Strapi and Contentful position standardized delivery APIs, live preview, and environment-aware delivery as baseline capabilities, alongside webhooks and tokenized access. These are now expected, not differentiators.

### User impact

- developers gain a stable content contract
- editors gain preview confidence
- downstream sites become easier to cache and scale
- security improves because raw table access leaves the browser path

### Feasibility

- feasibility: high
- complexity: medium
- implementation risk: moderate

### Technical implementation plan

1. Introduce a versioned delivery layer in `apps/cms` or a dedicated internal API package.
2. Move public read logic from direct Supabase access into server-side content services.
3. Add published-only public endpoints and authenticated preview endpoints.
4. Add preview tokens with expiry and content scoping.
5. Add webhook/revalidation hooks for frontend cache invalidation.
6. Refactor public blog rendering to consume the delivery client instead of direct browser DB calls.

### Testing plan

- unit tests for query services and token validation
- contract tests for REST endpoints
- integration tests for published vs preview behavior
- browser tests for preview flows

### Performance benchmark plan

- baseline current public blog list and detail response timings
- measure new API p50/p95 latency
- confirm no regression on public render times after moving to delivery API

### Documentation required

- API contract docs
- preview setup guide
- integration examples for public clients

## Feature 2: Editorial Governance Suite

Scope:

- revisions
- diffs
- rollback
- review workflow
- approvals
- audit log UI
- scheduled publishing

### Why it matters

This gives the CMS operational trust. Without it, multi-user editorial work stays fragile.

### Industry alignment

Enterprise headless CMS products increasingly treat RBAC, approvals, content history, audit logs, and release controls as a single governance layer. This is especially visible in current Strapi enterprise guidance and in enterprise comparison criteria across 2026 CMS evaluations.

### User impact

- editors avoid lost work and accidental publish errors
- reviewers gain visible approval gates
- admins gain auditability for compliance and incident response

### Feasibility

- feasibility: medium-high
- complexity: high
- implementation risk: moderate

### Technical implementation plan

1. Consolidate the partial workflow/history work already present in blog migrations.
2. Add shared platform services for revision capture and audit logging.
3. Add UI for timeline, revision compare, and rollback.
4. Add role-based workflow transitions and reviewer assignments.
5. Add scheduler execution path for scheduled publishing and unpublishing.
6. Ensure audit data is queryable and exportable.

### Testing plan

- unit tests for transition rules
- integration tests for mutation-to-audit coverage
- rollback correctness tests
- browser tests for review and publish flows

### Performance benchmark plan

- measure content mutation latency before and after revision capture
- verify audit insert overhead stays inside agreed mutation budget

### Documentation required

- editorial workflow guide
- audit model and retention notes
- admin runbook for rollback and scheduled publishing

## Feature 3: Media Library + Asset Pipeline

### Why it matters

This is the clearest missing editor-facing subsystem in the current product.

### Industry alignment

Media governance, transform pipelines, metadata, and asset reuse are standard in modern CMS products. They are also necessary to avoid compounding content debt as the platform expands to new content types.

### User impact

- editors stop copy-pasting image URLs
- content quality improves via alt text and metadata enforcement
- frontend performance improves through transformable assets

### Feasibility

- feasibility: high
- complexity: medium-high
- implementation risk: moderate

### Technical implementation plan

1. Introduce `plugin-media` with asset metadata tables.
2. Bind storage to Supabase Storage or an abstracted object store.
3. Add upload modal, asset browser, and selection flows.
4. Replace URL-first image input patterns in blog editing with asset references.
5. Add validation for type, size, and metadata completeness.
6. Add transform strategy for responsive delivery.

### Testing plan

- unit tests for validation and mapping
- integration tests for upload and retrieval
- browser tests for selecting media in the editor
- regression tests for existing blog image flows

### Performance benchmark plan

- measure upload timings by file size
- validate transformed asset response sizes and render effects
- verify asset browser responsiveness at scaled fixture counts

### Documentation required

- editor media workflow guide
- storage/configuration setup
- asset governance conventions

## Feature 4: Governed MCP Operations Center

### Why it matters

This is the most differentiated proposal. The project already has `plugin-mcp`, which means it can compete on AI-governed content operations more credibly than many generic CMS starters.

### Industry alignment

The 2026 market increasingly differentiates between simple AI generation and governed AI operations. Current enterprise CMS comparisons emphasize AI that acts within permissions, workflows, and audit boundaries rather than ad hoc generation alone.

### User impact

- platform teams gain safe, supervised AI-assisted content operations
- editors gain content QA, metadata validation, and batch recommendations
- the platform becomes meaningfully more automation-friendly

### Feasibility

- feasibility: medium
- complexity: high
- implementation risk: medium-high

### Technical implementation plan

1. Extend `plugin-mcp` from content CRUD toward governed operations.
2. Add explicit role-aware tool authorization and audit logging.
3. Start with read-heavy tools:
   - content QA
   - SEO metadata gaps
   - stale content reports
   - localization completeness
4. Add supervised write actions only after audit and approval hooks are in place.
5. Add admin UI to inspect MCP activity and permission scopes.

### Testing plan

- unit tests for tool authorization
- integration tests for audit capture
- contract tests for MCP schema stability
- browser tests for MCP admin inspection UI

### Performance benchmark plan

- measure report generation time across seeded datasets
- verify no material slowdown on normal editorial workflows

### Documentation required

- MCP operations guide
- governance and permission model
- incident handling notes for automated actions

## Feature 5: Signed Release Automation + Update Control

### Why it matters

The repository already contains an update engine and a new GitHub webhook path, but the current automation path is not production safe. This feature converts update automation from a demo convenience into an auditable release control system.

### Industry alignment

Safe releases, environments, promotions, and signed automation are core expectations for self-hosted and enterprise-friendly CMS products.

### User impact

- operators gain predictable rollouts and rollback control
- production risk drops materially
- the open-source/self-hosted story becomes stronger

### Feasibility

- feasibility: medium-high
- complexity: medium
- implementation risk: moderate

### Technical implementation plan

1. Replace direct `exec('pnpm run build')` webhook handling with a signed job dispatcher.
2. Verify GitHub webhook signatures.
3. Restrict accepted events and branches.
4. Add job status persistence and operator visibility.
5. Separate build from deploy and require an approval gate for production.
6. Integrate with the existing CLI update safety model instead of bypassing it.

### Testing plan

- unit tests for signature verification
- integration tests for accepted vs rejected webhook events
- failure-path tests for job dispatch and logging

### Performance benchmark plan

- measure webhook-to-job enqueue latency
- verify job runner overhead is negligible on normal request paths

### Documentation required

- deployment and rollback runbook
- webhook security setup
- operator guide for release approvals

## Prioritization

### Recommended approval set for Phase 1

Approve these three now:

1. Secure Delivery API + Live Preview
2. Editorial Governance Suite
3. Media Library + Asset Pipeline

### Why this set

- it addresses the largest user-facing gaps
- it creates the platform foundation required for future AI and automation work
- it reduces architectural and security debt instead of building on top of it

### Defer to Phase 2

4. Governed MCP Operations Center
5. Signed Release Automation + Update Control

These are valuable, but they benefit from the governance and delivery foundations above.

## Delivery Standards For Approved Features

For any approved implementation tranche, I recommend the following acceptance rules:

- unit, integration, and browser e2e coverage for each feature
- 95%+ coverage target on newly added files and modules
- no feature merged without typecheck and targeted tests passing
- technical docs updated in `docs/`
- user-facing operator/editor docs added where relevant
- benchmark notes included for each feature

## Risks To Address Before Or During Implementation

1. `dangerouslySetInnerHTML` rendering path should be sanitized or constrained.
2. Current webhook automation must not be treated as production-ready.
3. RBAC is still inconsistent across some plugin migrations and product surfaces.
4. There is no current e2e harness, so that must be added as part of the first approved tranche.

## Approval Request

Please approve one of the following:

- Option A, recommended: approve Features 1-3 for implementation now
- Option B: approve all five features as a larger multi-phase program
- Option C: choose a custom subset and sequence

Once approved, implementation should proceed in atomic chunks with:

- a written execution plan
- code changes
- tests
- docs
- benchmark evidence
- deployment readiness summary
