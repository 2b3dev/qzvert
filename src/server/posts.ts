import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  Post,
  PostInsert,
  PostUpdate,
  PostStatus,
  Category,
} from '../types/database'

// Create Supabase client from cookies (SSR-compatible)
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Helper: Check if user is admin
const checkAdminAccess = async (supabase: ReturnType<typeof getSupabaseFromCookies>) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { user, profile }
}

// Helper: Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .substring(0, 100) // Limit length
}

// ============================================
// PUBLIC FUNCTIONS (No auth required)
// ============================================

// Get published posts (public blog listing)
export interface GetPublishedPostsInput {
  page?: number
  limit?: number
  categorySlug?: string
  tag?: string
  featured?: boolean
}

export interface GetPublishedPostsResult {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

export const getPublishedPosts = createServerFn({ method: 'GET' })
  .inputValidator((data: GetPublishedPostsInput) => data)
  .handler(async ({ data }): Promise<GetPublishedPostsResult> => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const limit = data.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `, { count: 'exact' })
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category
    if (data.categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.categorySlug)
        .single()

      if (category) {
        query = query.eq('category_id', category.id)
      }
    }

    // Filter by tag
    if (data.tag) {
      query = query.contains('tags', [data.tag])
    }

    // Filter featured
    if (data.featured) {
      query = query.eq('featured', true)
    }

    const { data: posts, count, error } = await query

    if (error) {
      console.error('Failed to fetch posts:', error)
      throw new Error('Failed to fetch posts')
    }

    return {
      posts: (posts || []) as Post[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// Get single post by slug (public)
export const getPostBySlug = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<Post | null> => {
    const supabase = getSupabaseFromCookies()

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .eq('slug', data.slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Failed to fetch post:', error)
      throw new Error('Failed to fetch post')
    }

    return post as Post
  })

// Increment view count
export const incrementPostViewCount = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseFromCookies()
    await supabase.rpc('increment_post_view_count', { post_id: data.postId })
  })

// Get featured posts
export const getFeaturedPosts = createServerFn({ method: 'GET' })
  .inputValidator((data?: { limit?: number }) => data || {})
  .handler(async ({ data }): Promise<Post[]> => {
    const supabase = getSupabaseFromCookies()
    const limit = data?.limit || 5

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch featured posts:', error)
      return []
    }

    return (posts || []) as Post[]
  })

// Get recent posts
export const getRecentPosts = createServerFn({ method: 'GET' })
  .inputValidator((data?: { limit?: number }) => data || {})
  .handler(async ({ data }): Promise<Post[]> => {
    const supabase = getSupabaseFromCookies()
    const limit = data?.limit || 5

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch recent posts:', error)
      return []
    }

    return (posts || []) as Post[]
  })

// ============================================
// ADMIN FUNCTIONS (Auth required)
// ============================================

// Get all posts (admin)
export interface GetAdminPostsInput {
  page?: number
  limit?: number
  status?: PostStatus | 'all'
  search?: string
  sortBy?: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'view_count'
  sortOrder?: 'asc' | 'desc'
}

export interface GetAdminPostsResult {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

export const getAdminPosts = createServerFn({ method: 'GET' })
  .inputValidator((data?: GetAdminPostsInput) => data || {})
  .handler(async ({ data }): Promise<GetAdminPostsResult> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const page = data.page || 1
    const limit = data.limit || 20
    const offset = (page - 1) * limit
    const sortBy = data.sortBy || 'created_at'
    const sortOrder = data.sortOrder || 'desc'

    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `, { count: 'exact' })

    // Filter by status
    if (data.status && data.status !== 'all') {
      query = query.eq('status', data.status)
    }

    // Search
    if (data.search) {
      query = query.or(`title.ilike.%${data.search}%,excerpt.ilike.%${data.search}%`)
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    query = query.range(offset, offset + limit - 1)

    const { data: posts, count, error } = await query

    if (error) {
      console.error('Failed to fetch admin posts:', error)
      throw new Error('Failed to fetch posts')
    }

    return {
      posts: (posts || []) as Post[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// Get single post by ID (admin - can see any status)
export const getAdminPostById = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Post | null> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .eq('id', data.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error('Failed to fetch post')
    }

    return post as Post
  })

// Create post (admin)
export const createPost = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<PostInsert, 'user_id' | 'slug'> & { slug?: string }) => data)
  .handler(async ({ data }): Promise<Post> => {
    const supabase = getSupabaseFromCookies()
    const { user } = await checkAdminAccess(supabase)

    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.title)

    // Check if slug exists, append number if needed
    const { data: existingSlug } = await supabase
      .from('posts')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const insertData: PostInsert = {
      ...data,
      slug,
      user_id: user.id,
      published_at: data.status === 'published' ? (data.published_at || new Date().toISOString()) : data.published_at,
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Failed to create post:', error)
      throw new Error('Failed to create post')
    }

    return post as Post
  })

// Update post (admin)
export const updatePost = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string } & PostUpdate) => data)
  .handler(async ({ data }): Promise<Post> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { id, ...updateData } = data

    // If title changed and no explicit slug, update slug
    if (updateData.title && !updateData.slug) {
      updateData.slug = generateSlug(updateData.title)

      // Check if new slug conflicts (excluding current post)
      const { data: existingSlug } = await supabase
        .from('posts')
        .select('slug')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single()

      if (existingSlug) {
        updateData.slug = `${updateData.slug}-${Date.now()}`
      }
    }

    // Auto-set published_at when publishing
    if (updateData.status === 'published' && !updateData.published_at) {
      const { data: currentPost } = await supabase
        .from('posts')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!currentPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        author:profiles!posts_user_id_profiles_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Failed to update post:', error)
      throw new Error('Failed to update post')
    }

    return post as Post
  })

// Delete post (admin)
export const deletePost = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Failed to delete post:', error)
      throw new Error('Failed to delete post')
    }

    return { success: true }
  })

// Bulk update posts status (admin)
export const bulkUpdatePostStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; status: PostStatus }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; count: number }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const updateData: PostUpdate = { status: data.status }

    if (data.status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { error, count } = await supabase
      .from('posts')
      .update(updateData)
      .in('id', data.ids)

    if (error) {
      console.error('Failed to bulk update posts:', error)
      throw new Error('Failed to update posts')
    }

    return { success: true, count: count || 0 }
  })

// Get post stats (admin dashboard)
export const getPostStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    total: number
    published: number
    draft: number
    scheduled: number
    totalViews: number
  }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const [total, published, draft, scheduled, viewsResult] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('posts').select('view_count'),
    ])

    const totalViews = viewsResult.data?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

    return {
      total: total.count || 0,
      published: published.count || 0,
      draft: draft.count || 0,
      scheduled: scheduled.count || 0,
      totalViews,
    }
  }
)
