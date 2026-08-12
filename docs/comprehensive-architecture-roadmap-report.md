# IMBA CMS: Comprehensive Architecture & Feature Roadmap Report

This document provides a highly structured, information-dense technical audit of the IMBA CMS codebase. It evaluates the current architectural state, identifies critical gaps across security and operations, and establishes a prioritized implementation framework for modernizing the platform.

---

## 1. Codebase Architecture & Technical Audit

The IMBA CMS is currently structured as a PNPM/Turborepo monorepo, functioning as a headless CMS foundation built with React, TypeScript, and Supabase. 

- **Architectural Strengths:** The core system (`packages/core`) leverages a robust `createCMS()` registry pattern, allowing plugins (e.g., `plugin-blog`, `plugin-mcp`) to inject admin pages, routes, migrations, and seed data. The use of Zod for schema validation in the MCP layer (`plugin-mcp/src/entities/blog.ts`) and ordered SQL migrations provides a strong, type-safe foundation.
- **Performance Bottlenecks:** The platform currently acts as a hybrid monolith. Public content routes query Supabase directly from React client components rather than passing through a dedicated Delivery API. This prevents Edge caching, CDN optimization, and introduces latency bottlenecks for global delivery.
- **Technical Debt:** 
  - **Monolithic Routing:** Admin and public routes are tightly coupled. 
  - **Auth Layer Simplification:** The authentication wrapper (`packages/core/src/auth.ts`) relies on a binary `is_admin` check rather than a scalable Role-Based Access Control (RBAC) model.
  - **Media Handling:** Media insertion (e.g., in Tiptap) relies entirely on raw URL strings or Base64 encoding rather than a unified asset storage abstraction.

---

## 2. Missing Functionalities (Gaps Analysis)

The platform serves as a strong developer starter kit but currently lacks the maturity required for enterprise or multi-team adoption. 

- **Core Operations:** 
  - No generalized Content-Type/Schema Builder UI.
  - Complete absence of a Media/Asset Library (upload pipeline, transforms, tagging).
  - No content versioning, rollback, or diffing mechanisms.
- **Security & Governance:** 
  - No granular RBAC, team directories, or custom roles (e.g., Editor, Reviewer).
  - Lack of audit trails for tracking content mutations (Create/Update/Publish/Delete).
  - No enforced approval workflows (Draft → In Review → Approved).
- **Usability:** 
  - No global admin search or bulk actions (e.g., bulk publish/delete).
  - Missing localization/translation UI workflows, despite locale types existing in the schema.
- **Scalability:** 
  - No public, rate-limited REST or GraphQL Delivery API.
  - Absence of a Webhook/Event bus for triggering external static builds (e.g., Next.js/Vercel) or cache invalidation.
  - No multi-environment staging or release orchestration.

---

## 3. High-Impact New Features (Prioritized)

To shift the CMS from a "developer prototype" to a "credible enterprise foundation," the following features are prioritized by business value, risk mitigation, and user need:

1. **Granular RBAC & Admin Hardening:** (Critical) Foundational for trust. Prevents unauthorized mutations and supports separation of duties.
2. **Media Library & Asset Pipeline:** (Critical) Drastically reduces editorial friction and introduces asset governance.
3. **Content Versioning & Audit Logs:** (Critical) Essential for compliance, evidence trails, and rapid recovery from editorial mistakes.
4. **Delivery API & Webhooks:** (High) Unlocks true headless scalability, omnichannel delivery, and external cache invalidation.
5. **Localization & Environment Workflows:** (High) Required for multi-market scaling and safe staging-to-production promotion.

---

## 4. Step-by-Step Implementation Framework

### Feature 1: Granular RBAC & Admin Hardening
- **Technical Requirements:** Implement role definitions (`super_admin`, `editor`, `reviewer`) via Supabase Auth metadata. Update SQL Row-Level Security (RLS) policies to evaluate roles. Inject permission guards into the `AdminShell` and `createCMS` registry.
- **Resource Estimates:** 1 Full-Stack Engineer, 1 Frontend Engineer (Part-time). Estimated 2–4 weeks.
- **Integration Checkpoints:** 
  - (1) Define Role/Permission matrix. 
  - (2) Deploy updated RLS migrations. 
  - (3) Update Admin UI routing to hide unauthorized modules.
- **Success Metrics:** 100% of admin mutations guarded by role checks; zero unauthorized writes in integration tests.

### Feature 2: Media Library & Asset Pipeline
- **Technical Requirements:** Create `packages/plugin-media`. Bind to Supabase Storage. Build an upload UI modal with MIME validation, size quotas, and alt-text metadata. Integrate with the Tiptap editor.
- **Resource Estimates:** 1 Full-Stack Engineer, 1 Frontend Engineer. Estimated 3–5 weeks.
- **Integration Checkpoints:** 
  - (1) Storage bucket provisioning & SQL tables for metadata. 
  - (2) Asset browser UI component. 
  - (3) Replacement of URL-only fields in `plugin-blog`.
- **Success Metrics:** 80%+ reduction in manual image URL entry; 100% of uploads passing MIME/size validation.

### Feature 3: Content Versioning & Audit Logs
- **Technical Requirements:** Implement immutable, append-only revision tables for all content entities. Build serialization/diff logic. Enforce user identity propagation on all MCP and REST mutation paths.
- **Resource Estimates:** 1 Senior Full-Stack Engineer, 1 QA Engineer. Estimated 3–6 weeks.
- **Integration Checkpoints:** 
  - (1) Schema design for event logs. 
  - (2) Middleware/RPC interception for automatic revision creation. 
  - (3) Admin UI for visual diffs and 1-click rollbacks.
- **Success Metrics:** 100% mutation coverage in audit logs; reliable entity rollback without data corruption.

### Feature 4: Public REST Delivery API & Webhooks
- **Technical Requirements:** Extract database reads from the frontend into a versioned, read-only REST API. Implement API token management, rate limiting, and an async job queue (or Edge functions) for dispatching signed webhooks.
- **Resource Estimates:** 1 Backend Engineer. Estimated 2–4 weeks.
- **Integration Checkpoints:** 
  - (1) Token generation & validation layer. 
  - (2) Read-only `/api/v1/content` endpoints. 
  - (3) Outbound webhook dispatcher with retry logic.
- **Success Metrics:** Sub-100ms API response times (cached); reliable webhook delivery to external CI/CD pipelines.

---

## 5. Phased Rollout Roadmap

To mitigate risk and manage technical debt, execution must be strictly phased:

**Phase 1: Platform Trust & Core Safety (Months 0–2)**
- *Focus:* Making the CMS safe for real multi-user teams and enterprise compliance.
- *Deliverables:* RBAC implementation, Media Library, Versioning, and Audit Trails.

**Phase 2: Headless Competitiveness (Months 2–4)**
- *Focus:* Shifting away from direct DB reads to a scalable, integrable architecture.
- *Deliverables:* REST Delivery API, Webhooks/Event Bus, API Tokens, and Live Draft Preview.

**Phase 3: Scale & Multi-Market Readiness (Months 4–7)**
- *Focus:* Expanding the platform's reach for global enterprise use cases.
- *Deliverables:* Localization workflows (fallbacks, translation status), Environments (staging vs. production), and Global Admin Search.

**Phase 4: Product Expansion (Months 7+)**
- *Focus:* Enhancing the core product offering beyond the developer-centric base.
- *Deliverables:* Generalized Content-Type Builder UI, Reusable Page Blocks, and AI/MCP Copilot expansion (e.g., SEO suggestions, auto-tagging).