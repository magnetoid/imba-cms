# @imba/cli

The internal **update engine** for projects built on IMBA-CMS. It lets a
consumer project pull updates to the IMBA-CMS *managed* packages over time
**without ever overwriting their own themes, config, or content**.

## The managed-vs-local model

Every package in your project is one of two kinds:

| Kind        | What it is                                                                                   | Touched by `imba update`? |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------- |
| **Managed** | Packages owned by IMBA-CMS                                                                    | **Yes** — updated         |
| **Local**   | *Your* app(s), *your* custom `template-*`/plugin packages, your `createCMS` config, your data | **Never**                 |

**Managed** packages are exactly:

- `@imba/core`
- `@imba/ui`
- `@imba/tailwind-preset`
- `@imba/plugin-blog`
- `@imba/plugin-mcp`
- `@imba/template-cinema`

…plus any future upstream package matching `@imba/plugin-*` or
`@imba/template-*`. If you fork or vendor one of those names as your own, list it
in your **local overrides** and it is treated as local (never updated).

**Local** is everything else: your application, your bespoke
templates/plugins, the `createCMS` configuration that wires it all together, and
— importantly — your **content** (the rows in your Supabase database). The update
engine has no method capable of writing to any of these.

## The update channel: git tags

Updates are delivered as **git tags** on a pinned upstream checkout that holds
the managed packages. "Updating" means advancing that checkout from your current
tag to a newer one, then installing and applying any new migrations. Tags may be
plain semver (`v1.2.3`) or upstream-style (`imba-cms-foundation-v0.1.0`); the
engine reads the semver out of either form. (An npm-based channel may come
later; it is out of scope today.)

The managed checkout location defaults to the current working directory and can
be overridden with `IMBA_MANAGED_DIR`.

## The additive-only guarantee

Database updates are **additive-only**. Before anything is applied, every pending
migration is scanned for destructive SQL:

- `DROP TABLE`
- `DROP COLUMN`
- `ALTER TABLE … DROP …`
- `DELETE FROM`
- `TRUNCATE`

(Matches inside `-- line comments` are ignored.)

If any pending migration is destructive, the update is **refused** — it reports
exactly which migrations and why, and exits non-zero without changing anything.
Your content rows are never modified by an update.

### `--force` escape hatch

> **Warning:** `--force` lifts the additive-only guard and will run destructive
> migrations, which **can alter or delete data**. Take a backup first and only
> use it when you understand exactly what the migration does.

## Usage

```bash
# Update to the latest available tag (additive migrations only)
imba update

# Preview the plan without changing anything
imba update --dry-run

# Update to a specific tag
imba update --to v1.4.0

# Allow destructive migrations (dangerous — see warning above)
imba update --force

# Read-only health report: current/latest version, package inventory,
# pending migration count, and any destructive blockers
imba doctor

# Help (no DB or git env required)
imba --help
```

`imba doctor` and `imba --help` are read-only and run fine with no DB/git
environment configured.

## Recommendation: keep your code separate from the managed checkout

So that updates never touch your work, keep a clean separation:

- Your **app** lives in your own workspace, depending on the managed packages.
- Your **custom `template-*` / plugin** packages are your own — give them names
  outside the `@imba/*` namespace, or register them as local overrides.
- Your **content** lives in your database and is owned by you.

Because the update engine only ever advances the managed checkout, installs
dependencies, and applies *additive* managed migrations, anything you keep on
the local side of this line is guaranteed untouched by `imba update`.

## Programmatic use

The pure modules and the orchestrator are exported for embedding:

```ts
import { runUpdate, runDoctor, planUpdate, isDestructiveSql, createRealIO } from '@imba/cli'
```

`runUpdate` / `runDoctor` take an injected `UpdateIO`; the interface deliberately
exposes **no** method that could write to local packages, config, or content.
