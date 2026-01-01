import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  Comment,
  CommentInsert,
  CommentUpdate,
  CommentStatus,
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

// Helper: Get current user
const getCurrentUser = async (supabase: ReturnType<typeof getSupabaseFromCookies>) => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Authentication required')
  }
  return user
}

// ============================================
// PUBLIC FUNCTIONS
// ============================================

// Get approved comments for a post (public)
export interface GetCommentsInput {
  postId: string
  page?: number
  limit?: number
}

export interface GetCommentsResult {
  comments: Comment[]
  total: number
  page: number
  totalPages: number
}

export const getPostComments = createServerFn({ method: 'GET' })
  .inputValidator((data: GetCommentsInput) => data)
  .handler(async ({ data }): Promise<GetCommentsResult> => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const limit = data.limit || 20
    const offset = (page - 1) * limit

    // Get top-level comments only (parent_id is null)
    const { data: comments, count, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `, { count: 'exact' })
      .eq('post_id', data.postId)
      .eq('status', 'approved')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch comments:', error)
      throw new Error('Failed to fetch comments')
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
          `)
          .eq('parent_id', comment.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: true })

        return {
          ...comment,
          replies: replies || [],
          reply_count: replies?.length || 0,
        }
      })
    )

    return {
      comments: commentsWithReplies as Comment[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// Get comment count for a post (public)
export const getCommentCount = createServerFn({ method: 'GET' })
  .inputValidator((data: { postId: string }) => data)
  .handler(async ({ data }): Promise<number> => {
    const supabase = getSupabaseFromCookies()

    const { count, error } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', data.postId)
      .eq('status', 'approved')

    if (error) {
      console.error('Failed to get comment count:', error)
      return 0
    }

    return count || 0
  })

// ============================================
// AUTHENTICATED USER FUNCTIONS
// ============================================

// Create comment (requires login)
export const createComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: string; body: string; parentId?: string }) => data)
  .handler(async ({ data }): Promise<Comment> => {
    const supabase = getSupabaseFromCookies()
    const user = await getCurrentUser(supabase)

    // Check if post exists and allows comments
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, allow_comments, status')
      .eq('id', data.postId)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      throw new Error('Post not found')
    }

    if (!post.allow_comments) {
      throw new Error('Comments are disabled for this post')
    }

    // If replying, verify parent comment exists and is approved
    if (data.parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, status')
        .eq('id', data.parentId)
        .eq('post_id', data.postId)
        .eq('status', 'approved')
        .single()

      if (parentError || !parentComment) {
        throw new Error('Parent comment not found')
      }
    }

    // Check user's profile role - admins get auto-approved comments
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const insertData: CommentInsert = {
      post_id: data.postId,
      user_id: user.id,
      parent_id: data.parentId || null,
      body: data.body.trim(),
      status: isAdmin ? 'approved' : 'pending', // Admin comments auto-approved
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Failed to create comment:', error)
      throw new Error('Failed to create comment')
    }

    return comment as Comment
  })

// Update own comment (requires login)
export const updateComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; body: string }) => data)
  .handler(async ({ data }): Promise<Comment> => {
    const supabase = getSupabaseFromCookies()
    const user = await getCurrentUser(supabase)

    // Verify ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', data.id)
      .single()

    if (fetchError || !existingComment) {
      throw new Error('Comment not found')
    }

    if (existingComment.user_id !== user.id) {
      throw new Error('You can only edit your own comments')
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ body: data.body.trim() })
      .eq('id', data.id)
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Failed to update comment:', error)
      throw new Error('Failed to update comment')
    }

    return comment as Comment
  })

// Delete own comment (requires login)
export const deleteComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()
    const user = await getCurrentUser(supabase)

    // Verify ownership or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch comment to verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', data.id)
      .single()

    if (fetchError || !comment) {
      throw new Error('Comment not found')
    }

    if (comment.user_id !== user.id && !isAdmin) {
      throw new Error('You can only delete your own comments')
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Failed to delete comment:', error)
      throw new Error('Failed to delete comment')
    }

    return { success: true }
  })

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all comments (admin - for moderation)
export interface GetAdminCommentsInput {
  page?: number
  limit?: number
  status?: CommentStatus | 'all'
  postId?: string
}

export interface GetAdminCommentsResult {
  comments: (Comment & { post?: { id: string; title: string; slug: string } })[]
  total: number
  page: number
  totalPages: number
}

export const getAdminComments = createServerFn({ method: 'GET' })
  .inputValidator((data: GetAdminCommentsInput) => data)
  .handler(async ({ data }): Promise<GetAdminCommentsResult> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const page = data.page || 1
    const limit = data.limit || 20
    const offset = (page - 1) * limit

    let query = supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url),
        post:posts!comments_post_id_fkey(id, title, slug)
      `, { count: 'exact' })

    if (data.status && data.status !== 'all') {
      query = query.eq('status', data.status)
    }

    if (data.postId) {
      query = query.eq('post_id', data.postId)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: comments, count, error } = await query

    if (error) {
      console.error('Failed to fetch admin comments:', error)
      throw new Error('Failed to fetch comments')
    }

    return {
      comments: (comments || []) as (Comment & { post?: { id: string; title: string; slug: string } })[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// Update comment status (admin)
export const updateCommentStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; status: CommentStatus }) => data)
  .handler(async ({ data }): Promise<Comment> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ status: data.status })
      .eq('id', data.id)
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Failed to update comment status:', error)
      throw new Error('Failed to update comment')
    }

    return comment as Comment
  })

// Bulk update comment status (admin)
export const bulkUpdateCommentStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; status: CommentStatus }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; count: number }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { error, count } = await supabase
      .from('comments')
      .update({ status: data.status })
      .in('id', data.ids)

    if (error) {
      console.error('Failed to bulk update comments:', error)
      throw new Error('Failed to update comments')
    }

    return { success: true, count: count || 0 }
  })

// Delete comment (admin)
export const adminDeleteComment = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('Failed to delete comment:', error)
      throw new Error('Failed to delete comment')
    }

    return { success: true }
  })

// Get comment stats (admin)
export const getCommentStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    total: number
    pending: number
    approved: number
    spam: number
  }> => {
    const supabase = getSupabaseFromCookies()
    await checkAdminAccess(supabase)

    const [total, pending, approved, spam] = await Promise.all([
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'spam'),
    ])

    return {
      total: total.count || 0,
      pending: pending.count || 0,
      approved: approved.count || 0,
      spam: spam.count || 0,
    }
  }
)
