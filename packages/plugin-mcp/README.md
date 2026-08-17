# @imba/plugin-mcp

A standalone **Node MCP server** that exposes the IMBA CMS's Supabase-backed
content to external AI agents (Claude Code, Cursor, etc.) over the
[Model Context Protocol](https://modelcontextprotocol.io). Agents can **read**,
**query**, and **write** content through an explicit, server-side allowlist —
never through raw SQL.

The server holds the Supabase **service-role key** (full DB access) read from
the environment and exposes only the curated tools and resources below. The
service-role key lives server-side only; it is never accepted as a tool argument
nor returned in any response.

For hosted HTTP deployments, the server can now enforce:
- inbound HTTP auth
- capability-based tool/resource exposure

**Scope:** blog (`blog_posts`, `blog_categories`), pages (`pages_entries`),
projects (`projects_entries`) and site settings (`site_entries`). Each family is
gated on its own capabilities; see the tool table below.

## Environment variables

| Purpose            | Variable (preferred)              | Fallback                       |
| ------------------ | --------------------------------- | ------------------------------ |
| Supabase URL       | `IMBA_SUPABASE_URL`               | `SUPABASE_URL`                 |
| Service-role key   | `IMBA_SUPABASE_SERVICE_ROLE_KEY`  | `SUPABASE_SERVICE_ROLE_KEY`    |
| HTTP auth mode     | `IMBA_MCP_AUTH_MODE`              | none                           |
| Bearer token       | `IMBA_MCP_BEARER_TOKEN`           | -                              |
| Basic username     | `IMBA_MCP_BASIC_USERNAME`         | -                              |
| Basic password     | `IMBA_MCP_BASIC_PASSWORD`         | -                              |
| Tool capabilities  | `IMBA_MCP_ALLOWED_CAPABILITIES`   | full editorial allowlist (below) |

Both are required to start the server (but **not** for `--help`).

`IMBA_MCP_AUTH_MODE` supports:
- `none`: no inbound HTTP authentication
- `bearer`: require `Authorization: Bearer ...`
- `basic`: require HTTP Basic auth

`IMBA_MCP_ALLOWED_CAPABILITIES` is a comma-separated allowlist controlling
which MCP tools/resources are exposed at startup. Capability keys the server
understands (all granted by default; system capabilities such as
`settings.manage` and `users.manage` are never used by this server):
- `blog.read`, `blog.write`, `blog.publish`, `blog.delete`
- `pages.read`, `pages.write`, `pages.publish`
- `projects.read`, `projects.write`, `projects.publish`
- `site.read`, `site.write`, `site.publish`

## Running

Build first (emits `dist/`):

```bash
pnpm --filter @imba/plugin-mcp build
```

**stdio** (default — for local agents):

```bash
IMBA_SUPABASE_URL=https://YOUR.supabase.co \
IMBA_SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node /abs/path/to/packages/plugin-mcp/dist/bin.js
```

**streamable-HTTP** (for remote/hosted agents):

```bash
IMBA_SUPABASE_URL=https://YOUR.supabase.co \
IMBA_SUPABASE_SERVICE_ROLE_KEY=eyJ... \
IMBA_MCP_AUTH_MODE=bearer \
IMBA_MCP_BEARER_TOKEN=replace-me \
IMBA_MCP_ALLOWED_CAPABILITIES=blog.read,blog.write,blog.publish \
node /abs/path/to/packages/plugin-mcp/dist/bin.js --http --port 8765
# MCP endpoint: POST http://localhost:8765/mcp
```

During development you can skip the build with `pnpm --filter @imba/plugin-mcp dev`
(runs `tsx src/bin.ts`).

`--help` prints usage and exits 0 without needing any Supabase env:

```bash
node dist/bin.js --help
```

## Connect from Claude Code

```bash
claude mcp add imba-mcp \
  -e IMBA_SUPABASE_URL=https://YOUR.supabase.co \
  -e IMBA_SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  -- node /abs/path/to/packages/plugin-mcp/dist/bin.js
```

## Connect from Cursor / generic MCP clients

Add to your client's `mcpServers` config (e.g. `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "imba-mcp": {
      "command": "node",
      "args": ["/abs/path/to/packages/plugin-mcp/dist/bin.js"],
      "env": {
        "IMBA_SUPABASE_URL": "https://YOUR.supabase.co",
        "IMBA_SUPABASE_SERVICE_ROLE_KEY": "eyJ..."
      }
    }
  }
}
```

For a remote HTTP deployment, point your client at the streamable-HTTP endpoint
`http://HOST:8765/mcp` instead of spawning the command, and send the configured
auth header if `IMBA_MCP_AUTH_MODE` is `bearer` or `basic`.

## Exposed tools

| Tool                   | Description                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| `blog_list_posts`      | List posts (newest first); optional `status` filter and `limit`. |
| `blog_get_post`        | Get a single post by `slug` (null if not found).                 |
| `blog_search_posts`    | Search posts whose title/body match `query` (case-insensitive).  |
| `blog_create_post`     | Create a post; requires `title` + `slug`.                        |
| `blog_update_post`     | Update a post by `id` with a `patch` object.                     |
| `blog_delete_post`     | Permanently delete a post by `id`.                               |
| `blog_set_published`   | Publish/unpublish by `id` (stamps/clears `published_at`).        |
| `blog_list_categories` | List all blog categories.                                        |
| `pages_list`           | List the CMS pages (home/about/services/contact); optional `status`. |
| `pages_get`            | Get one page by `slug`.                                          |
| `pages_update`         | Patch a page's `title`, SEO fields or structured `content`.      |
| `pages_set_status`     | Publish/unpublish a page by `slug`.                              |
| `projects_list`        | List projects in sort order; `status`, `featured`, `limit` filters. |
| `projects_get`         | Get one project by `slug`.                                       |
| `projects_create`      | Create a project; requires `name` + `slug`, drafts by default.   |
| `projects_update`      | Patch a project by `id`.                                         |
| `projects_delete`      | Permanently delete a project by `id`.                            |
| `projects_set_status`  | Publish/unpublish a project by `id`.                             |
| `site_get_settings`    | The primary site settings row (brand, nav, footer).              |
| `site_update_settings` | Patch the site settings `title` / `content`.                     |
| `site_set_status`      | Publish/unpublish the site settings.                             |

`content` fields are JSON objects validated by the owning browser plugin's zod
schema (`@imba/plugin-pages`, `@imba/plugin-projects`, `@imba/plugin-site`);
this server passes them through, so send the same shape the admin editor saves.

## Exposed resources

| Resource URI               | Description                       |
| -------------------------- | --------------------------------- |
| `imba://blog/posts`        | All posts as JSON (newest first). |
| `imba://blog/posts/{slug}` | A single post addressed by slug.  |

## Architecture

| File                     | Responsibility                                                          |
| ------------------------ | ---------------------------------------------------------------------- |
| `src/config.ts`          | `readConfig()` (env) + `createServiceClient()` (service-role client).  |
| `src/entities/blog.ts`   | Pure blog logic + zod schemas. No MCP-SDK imports — unit-tested.       |
| `src/entities/content.ts`| Pages, projects and site settings logic + zod schemas.                 |
| `src/server.ts`          | `buildMcpServer(db)` — registers the allowlist tools + resources.      |
| `src/bin.ts`             | CLI entry: arg parsing, transport selection (stdio / HTTP).            |
| `src/index.ts`           | Public re-exports.                                                     |

Adding a new entity later: add `src/entities/<name>.ts` with the same
`(db, args)` shape + zod schemas, then register its tools/resources in
`buildMcpServer`.
