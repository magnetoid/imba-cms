# IMBA CMS Codebase Audit And Feature Roadmap

## 1. Executive Summary

This repository is a modular, plugin-oriented headless CMS built with React, TypeScript, Supabase, and a PNPM/Turbo monorepo. The platform already demonstrates a solid architectural base:

- A reusable CMS kernel in `packages/core`
- Pluggable routes, admin pages, migrations, and seed hooks
- A working blog domain in `packages/plugin-blog`
- A machine-oriented API layer through `packages/plugin-mcp`
- Row-level security and migration ordering

The product is currently strongest as a developer-oriented composable CMS starter for a blog use case. It is not yet competitive with mature headless CMS platforms for enterprise or multi-team adoption because several expected capabilities are still absent or incomplete:

- No generalized content modeling UI or schema builder
- No media library or upload pipeline
- No granular RBAC, editorial workflow, audit trail, or approval system
- No localization workflow despite locale types in the core model
- No conventional delivery API surface such as REST/GraphQL
- No environments, releases, or staging/promotion workflows
- Limited observability, deployment automation, and compliance features

The highest-value roadmap is therefore not "more plugin content types first." The best strategic move is to strengthen the platform layer so that future content domains can scale safely. The most important near-term wins are:

1. Granular RBAC and admin authorization hardening
2. Media library and asset pipeline
3. Content versioning, draft review, and approvals
4. Webhooks plus a public REST/GraphQL delivery layer
5. Localization and environment-based publishing workflows

These features would shift the product from "good prototype / developer starter" to "credible composable CMS foundation."

## 2. Codebase Overview

### Monorepo Shape

- `apps/imbaproduction`: example app that composes the CMS
- `packages/core`: core kernel, registry, auth, admin shell, migrations
- `packages/plugin-blog`: current content domain and editorial UI
- `packages/plugin-mcp`: MCP server exposing blog operations
- `packages/cli`: migration/update/doctor tooling
- `packages/ui`: shared UI primitives
- `packages/template-cinema`: public-facing website template

### Architectural Characteristics

- The CMS is composed through `createCMS()` and a registry pattern in `packages/core/src/createCMS.tsx`.
- Plugins contribute admin pages, routes, migrations, dictionaries, and seed hooks through typed plugin contracts in `packages/core/src/types.ts`.
- Supabase is used for persistence and auth, with SQL migrations and RLS policies rather than an ORM schema layer.
- The app is currently hybrid: it behaves as both a headless content platform foundation and a bundled frontend implementation.

### Important Technical Strengths

- Plugin dependency validation and route collision protection
- Ordered migrations and migration safety tooling
- TypeScript-first package structure
- Reasonable content editing UX in the blog editor
- Zod validation in MCP entities
- RLS-enabled database tables

## 3. Existing Capability Review

### 3.1 Content Modeling

Current state:

- Plugin-level content modeling exists in code through `PluginDef`, migrations, and TypeScript types.
- The platform can model domain entities through SQL plus app types.
- The only real content implementation is the blog module with posts, categories, and tags.

Implemented well:

- Dependency-aware plugin registration
- Schema composition through migrations
- Reusable plugin contract for future modules

Gaps:

- No schema builder or content-type builder
- No reusable field system for arbitrary models
- No component/block-based structured content model
- No relationship UI outside blog-specific logic
- No migration scaffolding for new content modules from the admin side

Assessment:

- Good base for developers
- Weak for product teams who need self-service modeling

### 3.2 Content Delivery

Current state:

- Public blog pages query Supabase directly from React components.
- The platform exposes an MCP API for blog operations, but not a conventional REST or GraphQL delivery API.
- Publish filtering is handled in client queries, while SQL read policies allow broad select access.

Implemented well:

- Working public content listing and detail pages
- Machine-oriented MCP integration
- Basic SEO fields in blog content

Gaps:

- No standardized content delivery API contract
- No GraphQL
- No REST content API
- No webhook/event system
- No cache invalidation or revalidation strategy
- No preview environment parity
- No release orchestration

Assessment:

- Adequate for a single app in the monorepo
- Not competitive for external consumers or multi-channel delivery

### 3.3 User Management

Current state:

- Supabase session auth exists
- Admin access is effectively session-gated in the shell
- Database policies reference a binary `is_admin()` helper

Implemented well:

- Basic sign-in/sign-out bootstrap
- Secure use of service-role secrets in MCP configuration

Gaps:

- No user directory
- No team management
- No invite flow
- No role editor
- No group-based permissions
- No ownership rules
- No SSO/SCIM
- No audit trail for user activity

Assessment:

- Good enough for a small internal team
- Insufficient for enterprise, agencies, or distributed editorial teams

### 3.4 Media Library

Current state:

- Media is not modeled as a first-class subsystem
- Blog editing uses URL fields for cover and OG images
- Tiptap image insertion is URL-based and allows base64 images

Implemented well:

- Basic image usage in editor flows

Gaps:

- No upload UI
- No asset browser
- No folders, tags, or metadata
- No asset reuse workflow
- No image transforms
- No validation or governance of uploaded assets
- No storage abstraction

Assessment:

- One of the clearest capability gaps in the whole product

### 3.5 API Layers

Current state:

- The product has an MCP server with curated tools and resources for blog posts and categories.
- There is no standard external API layer for broader integrations.

Implemented well:

- Zod-validated MCP operations
- Explicit allowlist of tools
- Multiple transport modes for MCP

Gaps:

- No public or authenticated REST API
- No GraphQL API
- No API token management
- No webhook subscriptions
- No versioned API contract
- No request rate limiting
- No API analytics/usage visibility

Assessment:

- Innovative for AI tooling use cases
- Incomplete for normal CMS integrations

## 4. Gap Analysis Against 2025-2026 Industry Expectations

Current headless CMS platforms competing for enterprise and developer adoption commonly emphasize:

- Granular RBAC, SSO, audit logs, and approval workflows
- Localization and multi-environment release management
- Media management and asset governance
- Live preview, version history, and rollback
- REST and/or GraphQL APIs, webhooks, SDKs, and preview APIs
- Strong delivery operations, rate limiting, observability, and predictable scaling

Representative market references:

- Strapi feature set highlights RBAC, SSO, API tokens, audit logs, localization, content history, and live preview: <https://strapi.io/features>
- 2026 industry guidance emphasizes environments, preview parity, safe releases, and governance as decision-critical criteria: <https://headlesscms.info/best-headless-cms/platforms>
- 2026 enterprise governance guidance emphasizes audit trails, approvals, RBAC, evidence export, and deployment/data residency control: <https://www.dotcms.com/blog/which-cms-platforms-provide-full-audit-trails-version-history-and-approval-workflows>

Compared with those expectations, IMBA CMS is currently:

- Strong in composable code architecture
- Promising in editorial UI foundation
- Early-stage in governance
- Early-stage in delivery APIs
- Underpowered in operations and compliance

## 5. Prioritized Feature Recommendations

Priority definitions:

- Critical: foundational for trust, safe adoption, and core market viability
- High: materially improves competitiveness and day-to-day usability
- Medium: important expansion after platform foundations are stable
- Low: differentiators or optimizations with lower immediate leverage

---

## 5.1 Critical Priority

### Feature: Granular RBAC And Admin Authorization Hardening

User value:

- Enables real team collaboration
- Prevents accidental or unauthorized content changes
- Supports enterprise separation of duties

Why it matters now:

- Current access control is effectively binary admin/non-admin.
- The admin shell is gated by session presence rather than explicit role-aware UI enforcement.

Suggested scope:

- Role model: `super_admin`, `content_admin`, `editor`, `author`, `reviewer`, `media_manager`
- Permission matrix by plugin and action
- Route-level and component-level authorization
- Ownership-aware permissions for content records
- Permission-aware navigation and action visibility

Technical feasibility:

- High feasibility
- Builds naturally on current Supabase auth and RLS patterns
- Requires new permission tables, policy updates, auth context enrichment, and admin UI guards

Integration complexity:

- Medium

Dependencies:

- Supabase auth metadata or dedicated team/role tables
- Shared permission evaluation utilities in `core`

Performance impact:

- Low to moderate
- Can remain small if permissions are cached per session and evaluated centrally

Security/compliance implications:

- Strong positive impact
- Required baseline for least-privilege, auditability, and policy enforcement

Testing requirements:

- Unit tests for permission resolution
- Integration tests for RLS policy correctness
- UI tests for guarded actions and route access
- Regression tests ensuring existing admin flows still work for valid roles

Resource estimate:

- 1 full-stack engineer
- 1 frontend engineer part-time for admin UX
- 1 QA/security review pass

Delivery estimate:

- 2 to 4 weeks

Success metrics:

- 100% of admin routes guarded by role-aware checks
- Zero unauthorized content mutations in test scenarios
- Reduced need for shared admin accounts

### Feature: Media Library And Upload Pipeline

User value:

- Removes URL-only asset workflows
- Makes editorial work faster and less error-prone
- Creates reusable asset governance across all future plugins

Why it matters now:

- The codebase explicitly defers media to a future plugin.
- The absence of asset management blocks professional editorial workflows.

Suggested scope:

- `plugin-media` with asset tables and storage bindings
- Upload UI, browse/select modal, metadata editing
- Folders/tags, alt text, MIME validation, size checks
- Image transforms and responsive variant generation
- Editor integrations for cover image and inline content

Technical feasibility:

- High feasibility
- Strong plugin fit within existing architecture

Integration complexity:

- Medium

Dependencies:

- Supabase Storage or compatible object store abstraction
- Background processing or edge functions for transforms if needed

Performance impact:

- Moderate
- Needs CDN strategy, lazy loading, and transform caching

Security/compliance implications:

- Requires file type validation, malware scanning considerations, signed URLs for restricted assets, retention rules, and asset ownership controls

Testing requirements:

- Upload validation tests
- Storage integration tests
- Editor integration tests
- Performance tests for large media libraries and transformed image delivery

Resource estimate:

- 1 full-stack engineer
- 1 frontend engineer
- Optional platform engineer for storage/CDN hardening

Delivery estimate:

- 3 to 5 weeks

Success metrics:

- 80%+ reduction in manual image URL entry
- Faster post creation time
- High media reuse rate across entries

### Feature: Content Versioning, Diff, Rollback, And Audit Trail

User value:

- Protects editors from accidental loss
- Enables compliance-friendly evidence trails
- Makes review and release processes trustworthy

Why it matters now:

- There is no version history, rollback, or operational audit capability.
- This is a major gap for enterprise adoption and safe collaboration.

Suggested scope:

- Immutable revision snapshots for content entities
- Human-readable diffs
- Rollback/restore flow
- Activity logs for create/update/delete/publish actions
- Exportable audit records for compliance review

Technical feasibility:

- Medium-high feasibility
- Best implemented as shared platform services used by plugins

Integration complexity:

- Medium-high

Dependencies:

- Revision tables or event log tables
- Shared serialization/diff logic
- User identity propagation on every mutation path

Performance impact:

- Moderate due to storage growth
- Manageable with append-only revision storage and retention policies

Security/compliance implications:

- Strong positive impact for regulated industries
- Must ensure tamper resistance and appropriate access to audit logs

Testing requirements:

- Revision creation tests on every mutation type
- Diff correctness tests
- Rollback integrity tests
- Audit export tests

Resource estimate:

- 1 senior full-stack engineer
- 1 QA engineer part-time

Delivery estimate:

- 3 to 6 weeks

Success metrics:

- 100% mutation coverage in audit records
- Reliable rollback of content entities
- Faster incident recovery from editorial mistakes

### Feature: Workflow States, Approvals, And Scheduled Publishing Engine

User value:

- Supports editorial review and governance
- Reduces accidental publishing
- Unlocks larger content teams and campaign planning

Why it matters now:

- `status` includes `scheduled`, but there is no real scheduling engine or approval workflow.

Suggested scope:

- Workflow states: draft, in_review, approved, scheduled, published, archived
- Role-based transitions
- Comments/assignees for review
- Scheduled publish/unpublish jobs

Technical feasibility:

- Medium feasibility
- Builds on blog status fields and future RBAC

Integration complexity:

- Medium-high

Dependencies:

- RBAC foundation
- Background job runner or scheduled edge function
- Optional notifications channel

Performance impact:

- Low to moderate

Security/compliance implications:

- Positive, especially for controlled publishing and evidence of approvals

Testing requirements:

- State transition tests
- Job execution tests
- Permission tests
- Regression tests around publish visibility and timing

Resource estimate:

- 1 full-stack engineer
- 1 frontend engineer part-time

Delivery estimate:

- 3 to 5 weeks

Success metrics:

- Lower publish-error rate
- Higher editor confidence
- Increased number of content items using review flow instead of direct publish

---

## 5.2 High Priority

### Feature: Public REST/GraphQL Delivery API

User value:

- Makes the CMS truly headless for external apps
- Improves developer adoption and integration flexibility
- Reduces coupling between frontend and Supabase schema details

Suggested scope:

- Versioned REST read API for common content retrieval
- Optional GraphQL schema for flexible querying
- API tokens and scoped access
- Published-only public endpoints, draft preview endpoints behind auth

Technical feasibility:

- High feasibility for REST
- Medium feasibility for GraphQL

Integration complexity:

- Medium

Dependencies:

- Shared content query service layer
- Token management
- Rate limiting
- API documentation

Performance impact:

- Moderate
- Requires caching, query constraints, and abuse protection

Security/compliance implications:

- Must enforce strong auth boundaries, token rotation, and rate limiting

Testing requirements:

- Contract tests
- Auth and permission tests
- Load tests for list/detail endpoints
- Backward compatibility tests for versioned API changes

Resource estimate:

- 1 backend/full-stack engineer
- 1 developer experience/documentation contributor part-time

Delivery estimate:

- REST: 2 to 4 weeks
- GraphQL add-on: +2 to 3 weeks

Success metrics:

- Increased external integration count
- Reduced direct frontend dependence on raw table queries
- Better API response latency under load

### Feature: Webhooks And Event System

User value:

- Connects the CMS to search, cache invalidation, marketing automation, and build pipelines
- Improves composability and ecosystem fit

Suggested scope:

- Outbound webhooks for create/update/publish/unpublish/delete
- Retry policy, signing secret, dead-letter log
- Plugin event bus for internal extensibility

Technical feasibility:

- High feasibility

Integration complexity:

- Medium

Dependencies:

- Job processing/retry worker
- Event payload contracts
- Signing utilities

Performance impact:

- Low on request path if processed asynchronously

Security/compliance implications:

- Requires signed payloads, replay protection, and secret rotation support

Testing requirements:

- Delivery and retry tests
- Signature verification tests
- Failure-path tests

Resource estimate:

- 1 full-stack engineer

Delivery estimate:

- 2 to 3 weeks

Success metrics:

- Reliable downstream sync rate
- Lower manual revalidation steps
- Faster integration setup time

### Feature: Localization And Translation Workflow

User value:

- Expands the CMS from local-only to multi-market content operations
- Aligns with core locale types already present in the platform model

Suggested scope:

- Locale-aware content entries
- Fallback chains
- Translation status tracking
- Locale-specific publish states
- Optional translation provider integration later

Technical feasibility:

- Medium feasibility

Integration complexity:

- High because it touches schemas, UI, delivery, and workflow

Dependencies:

- Data model refactor per content type
- Locale-aware query layer
- Editorial UX updates

Performance impact:

- Moderate due to larger query surfaces and indexing needs

Security/compliance implications:

- Requires locale-specific access and review controls in some organizations

Testing requirements:

- Locale fallback tests
- Publish-state tests per locale
- UI tests for translation completeness and filtering

Resource estimate:

- 1 senior full-stack engineer
- 1 frontend engineer

Delivery estimate:

- 4 to 7 weeks

Success metrics:

- Number of supported locales
- Reduced duplicate content maintenance
- Time-to-publish for translated entries

### Feature: Live Preview And Preview Tokens

User value:

- Lets editors validate changes before publishing
- Improves confidence and reduces production mistakes

Suggested scope:

- Draft preview endpoints
- Short-lived preview tokens
- Preview banner/state in the frontend
- Reference-aware preview support

Technical feasibility:

- High feasibility

Integration complexity:

- Medium

Dependencies:

- Delivery API or preview query path
- Authenticated preview session handling

Performance impact:

- Low to moderate

Security/compliance implications:

- Draft content must never leak publicly
- Tokens must expire and be scoped tightly

Testing requirements:

- Draft visibility tests
- Token expiry tests
- Preview parity tests

Resource estimate:

- 1 full-stack engineer
- 1 frontend engineer part-time

Delivery estimate:

- 2 to 3 weeks

Success metrics:

- Reduced publish-and-check behavior
- Higher preview usage by editors

---

## 5.3 Medium Priority

### Feature: Generalized Content-Type Builder

User value:

- Turns the platform from code-first starter into a broader CMS product

Feasibility:

- Medium-low in the short term because it requires a stable field system, schema storage strategy, validation layer, migration generation, and admin rendering framework

Complexity:

- High

Timeline:

- 8 to 14 weeks

Recommendation:

- Do not build first
- Start after RBAC, media, versions, and API foundations are in place

### Feature: Releases, Environments, And Content Promotion

User value:

- Supports enterprise-safe staging and coordinated launches

Feasibility:

- Medium

Complexity:

- High

Timeline:

- 5 to 8 weeks

Recommendation:

- Best sequenced after versioning and workflow state support

### Feature: Search, Filtering, And Admin Productivity Tools

User value:

- Faster navigation and lower editorial friction

Suggested scope:

- Global admin search
- Saved filters
- Bulk actions
- Content health indicators

Feasibility:

- High

Complexity:

- Medium

Timeline:

- 2 to 4 weeks

### Feature: Content Relationships And Reusable Blocks

User value:

- Improves structured content reuse
- Enables richer page-building patterns

Feasibility:

- Medium

Complexity:

- Medium-high

Timeline:

- 4 to 6 weeks

### Feature: API Tokens, Rate Limiting, And Usage Analytics

User value:

- Makes APIs safer and more enterprise-ready

Feasibility:

- High

Complexity:

- Medium

Timeline:

- 2 to 4 weeks

---

## 5.4 Low Priority

### Feature: AI Editorial Assistant Expansion

Current note:

- There is already lightweight AI drafting support in the blog admin.

Potential additions:

- AI tagging
- SEO suggestions
- readability checks
- translation drafts
- content gap analysis

Recommendation:

- Expand only after governance controls are in place

### Feature: Analytics Dashboard And Content Intelligence

Potential additions:

- publish velocity
- stale content detection
- SEO health scoring
- asset reuse metrics

Recommendation:

- Useful, but not foundational

### Feature: Visual Page Builder

Recommendation:

- Treat as long-term optional direction, not near-term core need
- The platform first needs stronger structured content, preview, and permissions

## 6. Feasibility Summary Matrix

| Feature | Priority | Feasibility | Complexity | Resource Profile | Estimated Timeline |
|---|---|---:|---:|---|---|
| Granular RBAC | Critical | High | Medium | 1-2 engineers | 2-4 weeks |
| Media library | Critical | High | Medium | 2 engineers | 3-5 weeks |
| Versioning + audit log | Critical | Medium-High | Medium-High | 1-2 engineers | 3-6 weeks |
| Workflow + approvals + scheduler | Critical | Medium | Medium-High | 1-2 engineers | 3-5 weeks |
| REST API | High | High | Medium | 1 engineer | 2-4 weeks |
| GraphQL API | High | Medium | Medium | 1 engineer | +2-3 weeks |
| Webhooks/event bus | High | High | Medium | 1 engineer | 2-3 weeks |
| Localization | High | Medium | High | 2 engineers | 4-7 weeks |
| Live preview | High | High | Medium | 1-2 engineers | 2-3 weeks |
| Content-type builder | Medium | Medium-Low | High | 2-3 engineers | 8-14 weeks |
| Environments/releases | Medium | Medium | High | 2 engineers | 5-8 weeks |
| Admin productivity tooling | Medium | High | Medium | 1 engineer | 2-4 weeks |

## 7. Recommended Roadmap

### Phase 1: Platform Trust And Core Editorial Safety (0-2 months)

Build in this order:

1. Granular RBAC and admin hardening
2. Media library
3. Versioning plus audit trail
4. Workflow states plus scheduling engine

Strategic outcome:

- The CMS becomes safe for real multi-user teams
- Editorial trust improves immediately
- The platform gains the governance baseline required for enterprise sales conversations

### Phase 2: Headless Platform Competitiveness (2-4 months)

Build in this order:

1. REST delivery API
2. Webhooks and event bus
3. Live preview
4. API tokens and rate limiting

Strategic outcome:

- The product becomes much more integrable
- Developer adoption improves
- Frontends and downstream systems can consume content without coupling to raw DB access

### Phase 3: Scale And Multi-Market Readiness (4-7 months)

Build in this order:

1. Localization workflow
2. Environments and content promotion
3. Admin productivity/search/bulk operations

Strategic outcome:

- The CMS becomes suitable for larger teams, multi-market operations, and controlled release management

### Phase 4: Product Expansion (7+ months)

Build selectively:

1. Content-type builder
2. Reusable blocks / structured page building
3. Analytics and AI copilots

Strategic outcome:

- The CMS evolves from a blog-oriented platform to a broader CMS product offering

## 8. Testing Strategy For Roadmap Delivery

The current repository already runs `build`, `lint`, `typecheck`, and `test` through Turbo, but the overall validation strategy is still heavily unit-oriented. For every roadmap feature, testing should expand in four layers:

### 8.1 Required Test Layers

- Unit tests for business logic and validation
- Integration tests for Supabase queries, RLS policies, and data lifecycle
- Browser/e2e tests for editorial workflows and admin authorization
- Performance tests for APIs, queries, and media operations under realistic load

### 8.2 Specific Test Requirements By Feature Family

RBAC:

- permission matrix tests
- negative authorization tests
- RLS policy regression suite

Media:

- upload validation
- transform generation
- signed URL access
- large library browse/search performance

Versioning/workflow:

- revision creation on every mutation path
- rollback correctness
- scheduled publish execution accuracy
- approval transition enforcement

API/webhooks:

- contract tests
- retry/idempotency tests
- signature verification
- rate limit enforcement

Localization:

- locale fallback behavior
- per-locale workflow tests
- query correctness with mixed locale availability

### 8.3 Recommended Quality Tooling Additions

- Playwright for admin/browser e2e
- Contract tests for public APIs
- Seeded integration test fixtures
- Basic load tests for content delivery and media operations
- CI workflows for build, test, lint, and typecheck on every change

## 9. Security And Compliance Considerations

Every proposed feature should be implemented with security and compliance as a first-class constraint.

### Immediate Security Risks Worth Addressing

- Public read policy on blog posts is broad; published-state protection is currently enforced in frontend query behavior rather than strict SQL read policy design.
- `marked.parse()` output is inserted via `dangerouslySetInnerHTML`, so sanitization and trusted-content assumptions should be reviewed before broader content input surfaces are added.
- Session presence in the admin shell is not sufficient as the long-term authorization model.

### Feature-Level Security Requirements

RBAC:

- least privilege
- defense-in-depth with both UI and RLS enforcement
- admin action logging

Media:

- MIME allowlists
- size quotas
- signed access where needed
- malware scanning strategy for uploads

Versioning and audit:

- tamper-evident event storage
- controlled access to audit exports
- retention and privacy policies

API and webhooks:

- token scopes
- rotation policies
- rate limiting
- signed webhooks
- replay protection

Localization and environments:

- region/data residency review if market-specific hosting is added later
- controlled promotion between environments

### Compliance Direction

To compete in regulated or enterprise contexts, the platform should plan for:

- exportable audit evidence
- retention policies
- data deletion workflows
- privacy-aware asset and content ownership controls
- SSO and enterprise identity integration

## 10. Long-Term Strategic Positioning

The codebase should not try to compete with large vendors on every feature immediately. The most realistic product strategy is:

- Keep the plugin-first developer architecture as a differentiator
- Build a stronger governance and editorial platform layer
- Lean into composability, self-hostability, and AI/MCP-friendly workflows

This creates a differentiated market story:

- More flexible than traditional enterprise suites
- More governable than lightweight CMS starters
- More automation-friendly than standard headless CMS products

## 11. Final Recommendation

The platform is technically promising and architecturally coherent, but it is still in an early product maturity stage. The best path forward is not broad feature sprawl. It is disciplined platform reinforcement.

Top recommendation order:

1. RBAC and authorization hardening
2. Media library
3. Versioning, audit, and workflow controls
4. REST/webhook delivery platform
5. Localization and environment workflows

If these are delivered successfully, IMBA CMS can move from a single-domain composable CMS prototype toward a serious headless CMS platform with stronger editorial UX, safer multi-user operations, better scalability, and materially improved market competitiveness.
