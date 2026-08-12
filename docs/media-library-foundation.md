# Media Library Foundation

This document describes the current media and editorial-governance slice added after the content delivery work.

## What is implemented

### New plugin

A new reusable plugin now exists at `@imba/plugin-media`.

It provides:

- a `media_files` registry table
- a Media Library admin module at `/admin/media`
- direct file upload into a configurable Supabase Storage bucket
- external URL registration for migrated or CDN-hosted assets
- in-place asset metadata editing
- storage-aware asset deletion for uploaded files
- a reusable media picker field for other plugins

## Database

The plugin migration creates `public.media_files` with:

- URL
- source type (`upload` or `external`)
- storage bucket/path
- alt text
- title
- MIME type
- size metadata
- image dimensions for uploaded image assets
- created/updated timestamps

RLS currently allows read access for authenticated editorial roles and write access for:

- `super_admin`
- `content_admin`
- `editor`
- `media_manager`

## Runtime configuration

Optional runtime values:

- `IMBA_MEDIA_BUCKET`

If omitted, the plugin defaults to:

- `cms-media`

## Blog integration

The blog editor no longer relies only on raw URL inputs for:

- cover image
- featured image
- OG image

Each field now supports:

- direct manual URL entry
- selecting an existing managed asset from the media library
- previewing the selected asset inline

## Asset lifecycle management

The Media Library now supports:

- editing title, alt text, and MIME type for any asset
- editing the URL for external assets only
- deleting assets from the CMS registry
- deleting uploaded storage objects before deleting the DB row

Uploaded asset URLs remain immutable in the UI and service layer so storage-backed assets cannot drift away from their actual bucket path.

## Editorial governance improvements

The blog editor now exposes two editorial history surfaces:

1. Activity timeline
   - sourced from `blog_post_audit_log`
2. Revision restore list
   - sourced from `blog_post_revisions`
   - lets editors restore a saved snapshot into the current editor state

This is intentionally a non-destructive first step. It restores content into the editor for review and resave, rather than silently mutating database state.

## Verification

Validated during implementation:

- `@imba/plugin-media` typecheck: passed
- `@imba/plugin-media` tests: passed (`7` tests)
- `@imba/plugin-blog` typecheck: passed
- `@imba/plugin-blog` tests: passed
- `imba-cms-admin` build: passed
- `imbaproduction` build: passed

## Build impact

Observed admin build output after the media and revision slice:

- JS bundle: `1180.80 kB`
- CSS bundle: `28.02 kB`

Observed admin build output after asset lifecycle completion:

- JS bundle: `1188.12 kB`
- CSS bundle: `28.09 kB`

The pre-existing chunk-size warning remains, but this slice did not introduce a qualitatively new performance failure. The next optimization step should be route-level code splitting for admin-only modules such as media and settings.

## Known next steps

- add asset bulk actions and pagination
- support private buckets plus signed URLs when required
- add browser e2e coverage for upload, pick, and revision restore flows
- move additional plugins from raw URL fields to managed assets
