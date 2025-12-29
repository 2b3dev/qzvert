import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

// Create Supabase client from cookies (SSR-compatible)
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

const BUCKET_NAME = 'thumbnails'

interface UploadImageInput {
  base64Data: string
  fileName: string
}

export const uploadImage = createServerFn({ method: 'POST' })
  .inputValidator((data: UploadImageInput) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Extract base64 content and mime type
    const matches = data.base64Data.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid base64 data format')
    }

    const mimeType = matches[1]
    const base64Content = matches[2]

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate unique file path: user_id/timestamp_filename
    const ext = mimeType.split('/')[1] || 'png'
    const filePath = `${user.id}/${Date.now()}_${data.fileName.replace(/\.[^/.]+$/, '')}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl }
  })

interface DeleteImageInput {
  imageUrl: string
}

export const deleteImage = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteImageInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Extract file path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/thumbnails/user_id/filename.ext
    const urlParts = data.imageUrl.split(
      `/storage/v1/object/public/${BUCKET_NAME}/`,
    )
    if (urlParts.length !== 2) {
      // Not a storage URL, ignore
      return { success: true }
    }

    const filePath = urlParts[1]

    // Verify user owns this file (path starts with their user_id)
    if (!filePath.startsWith(user.id)) {
      throw new Error('Unauthorized to delete this image')
    }

    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      throw new Error(`Failed to delete image: ${deleteError.message}`)
    }

    return { success: true }
  })
