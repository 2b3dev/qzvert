import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type { Collection, CollectionWithCount, SavedItemWithActivity } from '../types/database'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Get or create default collection for user
export const getOrCreateDefaultCollection = createServerFn({ method: 'POST' })
  .handler(async (): Promise<Collection> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Check if default collection exists
    const { data: existing } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (existing) {
      return existing as Collection
    }

    // Create default collection
    const { data: created, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: 'All Saved',
        is_default: true
      })
      .select()
      .single()

    if (error || !created) {
      throw new Error('Failed to create default collection')
    }

    return created as Collection
  })

// Get all collections for user
export const getCollections = createServerFn({ method: 'GET' })
  .handler(async (): Promise<CollectionWithCount[]> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Single query with item count using left join aggregate
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*, saved_items(count)')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch collections')
    }

    // Transform to CollectionWithCount
    const collectionsWithCount: CollectionWithCount[] = (collections || []).map((collection) => {
      const { saved_items, ...rest } = collection as typeof collection & { saved_items: { count: number }[] }
      return {
        ...rest,
        item_count: saved_items?.[0]?.count || 0
      } as CollectionWithCount
    })

    return collectionsWithCount
  })

// Create a new collection
export const createCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }): Promise<Collection> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: created, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: data.name,
        is_default: false
      })
      .select()
      .single()

    if (error || !created) {
      throw new Error('Failed to create collection')
    }

    return created as Collection
  })

// Update collection name
export const updateCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; name: string }) => data)
  .handler(async ({ data }): Promise<Collection> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: updated, error } = await supabase
      .from('collections')
      .update({ name: data.name })
      .eq('id', data.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !updated) {
      throw new Error('Failed to update collection')
    }

    return updated as Collection
  })

// Delete collection (cannot delete default)
export const deleteCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // RLS policy prevents deleting default collection
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', data.id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error('Failed to delete collection')
    }

    return { success: true }
  })

// Save activity to collection
export const saveActivity = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string; collectionId?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; itemId: string | null; collectionId: string; alreadySaved: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get collection ID (use default if not specified)
    let collectionId = data.collectionId
    if (!collectionId) {
      // Check if default collection exists
      const { data: existing } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (existing) {
        collectionId = existing.id
      } else {
        // Create default collection
        const { data: created, error: createError } = await supabase
          .from('collections')
          .insert({
            user_id: user.id,
            name: 'All Saved',
            is_default: true
          })
          .select('id')
          .single()

        if (createError || !created) {
          throw new Error('Failed to create default collection')
        }
        collectionId = created.id
      }
    }

    const { data: created, error } = await supabase
      .from('saved_items')
      .insert({
        user_id: user.id,
        activity_id: data.activityId,
        collection_id: collectionId
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Already saved - return success with alreadySaved flag
        return { success: true, itemId: null, collectionId, alreadySaved: true }
      }
      throw new Error('Failed to save activity')
    }

    return { success: true, itemId: created.id, collectionId, alreadySaved: false }
  })

// Remove activity from collection
export const unsaveActivity = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string; collectionId: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('activity_id', data.activityId)
      .eq('collection_id', data.collectionId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error('Failed to remove activity')
    }

    return { success: true }
  })

// Get saved items (all or by collection)
export const getSavedItems = createServerFn({ method: 'GET' })
  .inputValidator((data: { collectionId?: string }) => data)
  .handler(async ({ data }): Promise<SavedItemWithActivity[]> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    let query = supabase
      .from('saved_items')
      .select(`
        id,
        user_id,
        activity_id,
        collection_id,
        created_at,
        activity:activities (
          id,
          title,
          description,
          thumbnail,
          type,
          play_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data.collectionId) {
      query = query.eq('collection_id', data.collectionId)
    }

    const { data: items, error } = await query

    if (error) {
      throw new Error('Failed to fetch saved items')
    }

    return (items || []) as unknown as SavedItemWithActivity[]
  })

// Check if activity is saved
export const isActivitySaved = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }): Promise<{ saved: boolean; collectionIds: string[] }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { saved: false, collectionIds: [] }
    }

    const { data: items } = await supabase
      .from('saved_items')
      .select('collection_id')
      .eq('activity_id', data.activityId)
      .eq('user_id', user.id)

    const collectionIds = (items || []).map(item => item.collection_id)
    return { saved: collectionIds.length > 0, collectionIds }
  })

// Move item to another collection
export const moveToCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { itemId: string; newCollectionId: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get current item to check activity_id
    const { data: item } = await supabase
      .from('saved_items')
      .select('activity_id')
      .eq('id', data.itemId)
      .eq('user_id', user.id)
      .single()

    if (!item) {
      throw new Error('Item not found')
    }

    // Delete old item and create new one in target collection
    const { error: deleteError } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', data.itemId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error('Failed to move item')
    }

    const { error: insertError } = await supabase
      .from('saved_items')
      .insert({
        user_id: user.id,
        activity_id: item.activity_id,
        collection_id: data.newCollectionId
      })

    if (insertError) {
      throw new Error('Failed to move item to new collection')
    }

    return { success: true }
  })
