export { readConfig, createServiceClient, type McpConfig } from './config.js'
export { buildMcpServer, SERVER_NAME, SERVER_VERSION, TOOL_NAMES } from './server.js'
export {
  // entity functions
  listPosts,
  getPostBySlug,
  searchPosts,
  listCategories,
  createPost,
  updatePost,
  deletePost,
  setPublished,
  // schemas
  listPostsSchema,
  getPostBySlugSchema,
  searchPostsSchema,
  createPostSchema,
  updatePostSchema,
  deletePostSchema,
  setPublishedSchema,
  blogStatusSchema,
  // table constants + types
  POSTS_TABLE,
  CATEGORIES_TABLE,
  type Db,
  type BlogStatus,
  type CreatePostInput,
  type UpdatePostArgs,
  type ListPostsArgs,
  type SetPublishedArgs,
} from './entities/blog.js'
