import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
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

// Helper: Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

// ============================================
// PUBLIC FUNCTIONS
// ============================================

// Get all categories (public - for navigation/sidebar)
export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Category[]> => {
    const supabase = getSupabaseFromCookies()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }

    return categories as Category[]
  }
)

// Get categories as tree structure (with children)
export const getCategoryTree = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Category[]> => {
    const supabase = getSupabaseFromCookies()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }

    // Build tree structure
    const categoryMap = new Map<string, Category & { children: Category[] }>()
    const roots: (Category & { children: Category[] })[] = []

    // First pass: create map with empty children arrays
    for (const cat of categories || []) {
      categoryMap.set(cat.id, { ...cat, children: [] })
    }

    // Second pass: build tree
    for (const cat of categories || []) {
      const node = categoryMap.get(cat.id)!
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }
)

// Get category by slug (public)
export const getCategoryBySlug = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<Category | null> => {
    const supabase = getSupabaseFromCookies()

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', data.slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Failed to fetch category:', error)
      return null
    }

    return category as Category
  })

// Get categories with post count (public - for sidebar)
export const getCategoriesWithCount = createServerFn({ method: 'GET' }).handler(
  async (): Promise<(Category & { post_count: number; activity_count: number })[]> => {
    const supabase = getSupabaseFromCookies()

    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (catError) {
      console.error('Failed to fetch categories:', catError)
      return []
    }

    // Get post counts per category
    const { data: postCounts, error: postCountError } = await supabase
      .from('posts')
      .select('category_id')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())

    // Get activity counts per category (public activities only)
    const { data: activityCounts, error: activityCountError } = await supabase
      .from('activities')
      .select('category_id')
      .eq('status', 'public')

    if (postCountError) {
      console.error('Failed to fetch post counts:', postCountError)
    }
    if (activityCountError) {
      console.error('Failed to fetch activity counts:', activityCountError)
    }

    // Count posts per category
    const postCountMap = new Map<string, number>()
    for (const post of postCounts || []) {
      if (post.category_id) {
        postCountMap.set(post.category_id, (postCountMap.get(post.category_id) || 0) + 1)
      }
    }

    // Count activities per category
    const activityCountMap = new Map<string, number>()
    for (const activity of activityCounts || []) {
      if (activity.category_id) {
        activityCountMap.set(activity.category_id, (activityCountMap.get(activity.category_id) || 0) + 1)
      }
    }

    return (categories || []).map(cat => ({
      ...cat,
      post_count: postCountMap.get(cat.id) || 0,
      activity_count: activityCountMap.get(cat.id) || 0,
    }))
  }
)

// Get activities by category slug (public)
export const getActivitiesByCategory = createServerFn({ method: 'GET' })
  .inputValidator((data: { categorySlug: string; page?: number; limit?: number }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const limit = data.limit || 12
    const offset = (page - 1) * limit

    // First get the category by slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', data.categorySlug)
      .single()

    if (catError || !category) {
      return { activities: [], total: 0, totalPages: 0 }
    }

    // Get total count
    const { count } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('status', 'public')

    // Get activities
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        created_at,
        title,
        description,
        thumbnail,
        type,
        play_count,
        tags,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('category_id', category.id)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch activities by category:', error)
      return { activities: [], total: 0, totalPages: 0 }
    }

    return {
      activities: activities || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all categories (admin - with more details)
export const getAdminCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<(Category & { post_count: number; activity_count: number; parent?: Category })[]> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      throw new Error('Failed to fetch categories')
    }

    // Get post counts
    const { data: postCounts } = await supabase
      .from('posts')
      .select('category_id')

    // Get activity counts
    const { data: activityCounts } = await supabase
      .from('activities')
      .select('category_id')

    const postCountMap = new Map<string, number>()
    for (const post of postCounts || []) {
      if (post.category_id) {
        postCountMap.set(post.category_id, (postCountMap.get(post.category_id) || 0) + 1)
      }
    }

    const activityCountMap = new Map<string, number>()
    for (const activity of activityCounts || []) {
      if (activity.category_id) {
        activityCountMap.set(activity.category_id, (activityCountMap.get(activity.category_id) || 0) + 1)
      }
    }

    // Build parent references
    const categoryMap = new Map<string, Category>()
    for (const cat of categories || []) {
      categoryMap.set(cat.id, cat)
    }

    return (categories || []).map(cat => ({
      ...cat,
      post_count: postCountMap.get(cat.id) || 0,
      activity_count: activityCountMap.get(cat.id) || 0,
      parent: cat.parent_id ? categoryMap.get(cat.parent_id) : undefined,
    }))
  }
)

// Create category (admin)
export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<CategoryInsert, 'slug'> & { slug?: string }) => data)
  .handler(async ({ data }): Promise<Category> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.name)

    // Check if slug exists
    const { data: existingSlug } = await supabase
      .from('categories')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const insertData: CategoryInsert = {
      ...data,
      slug,
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create category:', error)
      throw new Error('Failed to create category')
    }

    return category as Category
  })

// Update category (admin)
export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string } & CategoryUpdate) => data)
  .handler(async ({ data }): Promise<Category> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { id, ...updateData } = data

    // Prevent circular parent reference
    if (updateData.parent_id === id) {
      throw new Error('Category cannot be its own parent')
    }

    // If name changed and no explicit slug, update slug
    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name)

      // Check if new slug conflicts
      const { data: existingSlug } = await supabase
        .from('categories')
        .select('slug')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single()

      if (existingSlug) {
        updateData.slug = `${updateData.slug}-${Date.now()}`
      }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update category:', error)
      throw new Error('Failed to update category')
    }

    return category as Category
  })

// Delete category (admin)
export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    // Check if category has posts
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', data.id)

    if (postCount && postCount > 0) {
      throw new Error(`Cannot delete category with ${postCount} posts. Please reassign posts first.`)
    }

    // Check if category has activities
    const { count: activityCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', data.id)

    if (activityCount && activityCount > 0) {
      throw new Error(`Cannot delete category with ${activityCount} activities. Please reassign activities first.`)
    }

    // Check if category has children
    const { count: childCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', data.id)

    if (childCount && childCount > 0) {
      throw new Error(`Cannot delete category with ${childCount} subcategories. Please delete or reassign them first.`)
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Failed to delete category:', error)
      throw new Error('Failed to delete category')
    }

    return { success: true }
  })

// Reorder categories (admin)
export const reorderCategories = createServerFn({ method: 'POST' })
  .inputValidator((data: { orders: { id: string; order_index: number }[] }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    // Update each category's order
    const updates = data.orders.map(({ id, order_index }) =>
      supabase
        .from('categories')
        .update({ order_index })
        .eq('id', id)
    )

    await Promise.all(updates)

    return { success: true }
  })
