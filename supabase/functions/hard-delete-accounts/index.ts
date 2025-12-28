// Supabase Edge Function for hard deleting expired accounts
// This function should be scheduled to run daily via Supabase Cron
// Schedule: 0 3 * * * (every day at 3 AM UTC)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeletedProfile {
  id: string
  display_name: string | null
  deleted_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify this is called by Supabase Cron or with service role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Find all accounts marked for deletion more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: expiredProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo)

    if (fetchError) {
      throw new Error(`Failed to fetch expired profiles: ${fetchError.message}`)
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired accounts to delete',
          deletedCount: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const deletedUsers: string[] = []
    const errors: string[] = []

    for (const profile of expiredProfiles as DeletedProfile[]) {
      try {
        // Delete user from auth.users (this cascades to profiles due to FK)
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(profile.id)

        if (deleteAuthError) {
          errors.push(`Failed to delete user ${profile.id}: ${deleteAuthError.message}`)
          continue
        }

        deletedUsers.push(profile.id)
        console.log(`Successfully deleted user: ${profile.id} (${profile.display_name || 'no name'})`)
      } catch (err) {
        errors.push(`Error deleting user ${profile.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Log summary
    console.log(`Hard delete completed: ${deletedUsers.length} deleted, ${errors.length} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedUsers.length,
        deletedUsers,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Hard delete error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
