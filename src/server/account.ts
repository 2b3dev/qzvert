import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Soft delete account - marks the account for deletion
// The account will be permanently deleted after 30 days
export const softDeleteAccount = createServerFn({ method: 'POST' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Check if already deleted
    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .single()

    if (profile?.deleted_at) {
      throw new Error('Account already marked for deletion')
    }

    // Call the database function to soft delete
    const { error } = await supabase.rpc('soft_delete_account', {
      user_id: user.id
    })

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`)
    }

    // Sign out the user after marking for deletion
    await supabase.auth.signOut()

    return {
      success: true,
      message: 'Account marked for deletion. It will be permanently deleted in 30 days.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  })

// Check if account is pending deletion
export const getAccountDeletionStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { isPendingDeletion: false, deletedAt: null, permanentDeletionDate: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .single()

    if (!profile?.deleted_at) {
      return { isPendingDeletion: false, deletedAt: null, permanentDeletionDate: null }
    }

    const deletedAt = new Date(profile.deleted_at)
    const permanentDeletionDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      isPendingDeletion: true,
      deletedAt: profile.deleted_at,
      permanentDeletionDate: permanentDeletionDate.toISOString()
    }
  })

// Restore account (admin only)
export const restoreAccount = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Call the database function to restore
    const { error } = await supabase.rpc('restore_account', {
      target_user_id: data.userId
    })

    if (error) {
      throw new Error(`Failed to restore account: ${error.message}`)
    }

    return { success: true }
  })

// Get accounts pending deletion (admin only)
export const getPendingDeletions = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { data: pendingDeletions, error } = await supabase
      .from('profiles')
      .select('id, display_name, deleted_at, created_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch pending deletions: ${error.message}`)
    }

    return (pendingDeletions || []).map(profile => ({
      ...profile,
      permanentDeletionDate: new Date(
        new Date(profile.deleted_at!).getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      daysRemaining: Math.max(0, Math.ceil(
        (new Date(profile.deleted_at!).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
      ))
    }))
  })
