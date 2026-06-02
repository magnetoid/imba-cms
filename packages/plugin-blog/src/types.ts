export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  body?: string
  cover_image_url?: string
  author_id?: string
  category?: string
  tags?: string[]
  seo_title?: string
  seo_description?: string
  read_time_minutes?: number
  published: boolean
  published_at?: string
  created_at: string
  status?: 'draft' | 'published' | 'scheduled'
  author_name?: string
  og_image_url?: string
  category_id?: string
  featured_image_url?: string
  blog_categories?: { name: string; slug: string }
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}
