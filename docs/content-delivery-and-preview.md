# Content Delivery API And Draft Preview

This document describes the first implementation slice of the approved 2026 feature tranche.

## What is implemented

### Public delivery endpoints

The settings server now exposes public, read-only blog delivery endpoints:

- `GET /api/content/blog/posts`
- `GET /api/content/blog/posts/:slug`

These endpoints return published content only unless a valid preview token is provided.

Published-only delivery for the other content plugins (no preview path):

- `GET /api/content/pages`, `GET /api/content/pages/:slug`
- `GET /api/content/projects`, `GET /api/content/projects/:slug`
- `GET /api/content/site`

The pages, projects and site plugins switch to these when `IMBA_CONTENT_API_URL`
is set, exactly as the blog plugin does.

### Draft preview tokens

Authorized CMS users can request a short-lived preview token:

- `POST /api/content/blog/preview-token`

Request body:

```json
{
  "slug": "hello-world",
  "expiresInSeconds": 1800
}
```

The request requires a bearer token with `blog.read` access.

## Runtime configuration

To route the blog plugin through the content API instead of direct Supabase browser reads, expose:

- `IMBA_CONTENT_API_URL`
- `IMBA_CONTENT_PREVIEW_TOKEN` (optional, usually not needed globally)

For the server to mint preview tokens, set:

- `IMBA_CONTENT_PREVIEW_SECRET`

## Editor workflow

In the blog editor:

- published posts can still be opened normally
- draft and scheduled posts can now open a preview flow through the delivery API when `IMBA_CONTENT_API_URL` and `IMBA_CONTENT_PREVIEW_SECRET` are configured

## Governance slice included

The blog editor now shows recent audit activity from `blog_post_audit_log`, surfacing:

- event type
- actor email
- workflow status
- timestamp

This is the first visible part of the editorial governance suite.

## Validation status

Verified during implementation:

- `@imba/settings-server` typecheck: passed
- `@imba/settings-server` tests: passed
- `@imba/plugin-blog` typecheck: passed
- `@imba/plugin-blog` tests: passed

## Lightweight benchmark note

Synthetic preview-token verification benchmark on the local machine:

- 10,000 verifications
- 523.08 ms total
- 0.052308 ms average per verification

This does not replace route-level or end-to-end performance testing, but it confirms that preview token validation itself is not a meaningful latency concern.

## Known next steps

- add formal revision diff UI (restore exists in the blog editor)
- preview tokens for pages/projects (delivery is published-only today)
- add browser e2e coverage for preview flows
