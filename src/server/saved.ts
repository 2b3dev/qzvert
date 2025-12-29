import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  Collection,
  CollectionWithCount,
  SavedItemWithActivity,
} from '../types/database'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Get all collections for user (includes virtual "All Saved" as first item)
export const getCollections = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<CollectionWithCount>> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get total saved items count (all items regardless of collection)
    const { count: totalCount } = await supabase
      .from('saved_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get user's custom collections with item counts
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*, saved_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch collections')
    }

    // Transform to CollectionWithCount
    const collectionsWithCount: Array<CollectionWithCount> = (
      collections || []
    ).map((collection) => {
      const { saved_items, ...rest } = collection
      return {
        ...rest,
        item_count: saved_items?.[0]?.count || 0,
      } as CollectionWithCount
    })

    // Add virtual "All Saved" collection at the beginning
    const allSavedCollection: CollectionWithCount = {
      id: 'all', // Special ID for "All Saved"
      user_id: user.id,
      name: 'All Saved',
      created_at: new Date().toISOString(),
      item_count: totalCount || 0,
    }

    return [allSavedCollection, ...collectionsWithCount]
  },
)

// Create a new collection
export const createCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }): Promise<Collection> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: created, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: data.name,
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
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

// Delete collection
export const deleteCollection = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Cannot delete virtual "All Saved" collection
    if (data.id === 'all') {
      throw new Error('Cannot delete All Saved collection')
    }

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

// Save activity to collection (null collection_id = "All Saved")
// This will MOVE the activity to the new collection (delete from old, add to new)
export const saveActivity = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { activityId: string; collectionId?: string | null }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean
      itemId: string | null
      collectionId: string | null
      alreadySaved: boolean
    }> => {
      const supabase = getSupabaseFromCookies()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      // Use null for "All Saved" (virtual collection with id='all' or no collection specified)
      const collectionId =
        data.collectionId === 'all' ? null : (data.collectionId ?? null)

      // Delete any existing saved items for this activity (move behavior)
      await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', data.activityId)

      const { data: created, error } = await supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          activity_id: data.activityId,
          collection_id: collectionId,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Already saved - return success with alreadySaved flag
          return {
            success: true,
            itemId: null,
            collectionId,
            alreadySaved: true,
          }
        }
        throw new Error('Failed to save activity')
      }

      return {
        success: true,
        itemId: created.id,
        collectionId,
        alreadySaved: false,
      }
    },
  )

// Remove activity from saved items
export const unsaveActivity = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { activityId: string; collectionId?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Handle virtual "All Saved" collection (id='all' means null in DB)
    const collectionId = data.collectionId === 'all' ? null : data.collectionId

    let query = supabase
      .from('saved_items')
      .delete()
      .eq('activity_id', data.activityId)
      .eq('user_id', user.id)

    // Filter by collection_id (null for "All Saved")
    if (collectionId === null || collectionId === undefined) {
      query = query.is('collection_id', null)
    } else {
      query = query.eq('collection_id', collectionId)
    }

    const { error } = await query

    if (error) {
      throw new Error('Failed to remove activity')
    }

    return { success: true }
  })

// Get saved items (all or by collection)
// collectionId = 'all' or undefined → all items
// collectionId = null → items with null collection_id (no specific collection)
// collectionId = uuid → items in that specific collection
export const getSavedItems = createServerFn({ method: 'GET' })
  .inputValidator((data: { collectionId?: string | null }) => data)
  .handler(async ({ data }): Promise<Array<SavedItemWithActivity>> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    let query = supabase
      .from('saved_items')
      .select(
        `
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
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by collection
    if (data.collectionId && data.collectionId !== 'all') {
      query = query.eq('collection_id', data.collectionId)
    }
    // If collectionId is 'all' or undefined, return all items (no filter)

    const { data: items, error } = await query

    if (error) {
      throw new Error('Failed to fetch saved items')
    }

    return (items || []) as unknown as Array<SavedItemWithActivity>
  })

// Check if activity is saved
export const isActivitySaved = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ saved: boolean; collectionIds: Array<string | null> }> => {
      const supabase = getSupabaseFromCookies()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        return { saved: false, collectionIds: [] }
      }

      const { data: items } = await supabase
        .from('saved_items')
        .select('collection_id')
        .eq('activity_id', data.activityId)
        .eq('user_id', user.id)

      // collection_id can be null (for "All Saved" / no collection)
      const collectionIds = (items || []).map((item) => item.collection_id)
      return { saved: collectionIds.length > 0, collectionIds }
    },
  )

// Move item to another collection
export const moveToCollection = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { itemId: string; newCollectionId: string | null }) => data,
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
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

    // Handle virtual "All Saved" collection (id='all' means null in DB)
    const newCollectionId =
      data.newCollectionId === 'all' ? null : data.newCollectionId

    // Delete old item and create new one in target collection
    const { error: deleteError } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', data.itemId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error('Failed to move item')
    }

    const { error: insertError } = await supabase.from('saved_items').insert({
      user_id: user.id,
      activity_id: item.activity_id,
      collection_id: newCollectionId,
    })

    if (insertError) {
      throw new Error('Failed to move item to new collection')
    }

    return { success: true }
  })
