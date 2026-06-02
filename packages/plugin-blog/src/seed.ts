import type { PluginContext } from '@imba/core'
import { SEED_POSTS } from './seed-data'

export async function seed(ctx: PluginContext): Promise<void> {
  for (const post of SEED_POSTS) {
    await ctx.db.from('blog_posts').upsert(post, { onConflict: 'slug' })
  }
}
