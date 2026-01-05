import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  ExtractedContent,
  ExtractedContentInsert,
  ExtractedContentUpdate,
  ExtractionInputType,
  ExtractionMetadata,
} from '../types/database'
import { logAIUsage } from './admin-settings'
import { getGeminiApiUrl, getGeminiModel } from './gemini-config'

// Create Supabase client from cookies (SSR-compatible)
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Helper to get untyped supabase client for the extracted_contents table
// This is needed because the table may not exist in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUntypedClient = () => getSupabaseFromCookies() as any

const EXTRACTED_FILES_BUCKET = 'extracted-files'

// ============================================
// Helper Functions
// ============================================

// Count words in text
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

// Convert base64 to Uint8Array
function base64ToBytes(base64Data: string): { bytes: Uint8Array; mimeType: string } {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data format')
  }

  const mimeType = matches[1]
  const base64Content = matches[2]

  const binaryString = atob(base64Content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return { bytes, mimeType }
}

// ============================================
// File Extraction Functions
// ============================================

interface ExtractFileInput {
  base64Data: string
  fileName: string
  inputType: 'pdf' | 'excel' | 'doc' | 'image'
}

interface ExtractFileResult {
  text: string
  metadata: ExtractionMetadata
}

// Extract text from PDF
async function extractPDFText(base64Data: string, fileName: string): Promise<ExtractFileResult> {
  // Dynamic import for pdf-parse (server-side only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any
  const pdfParse = pdfParseModule.default || pdfParseModule

  const { bytes } = base64ToBytes(base64Data)
  const buffer = Buffer.from(bytes)

  const pdfData = await pdfParse(buffer)

  return {
    text: pdfData.text.trim(),
    metadata: {
      title: pdfData.info?.Title || fileName.replace(/\.pdf$/i, ''),
      author: pdfData.info?.Author,
      pageCount: pdfData.numpages,
      wordCount: countWords(pdfData.text),
    },
  }
}

// Extract text from Excel/CSV
async function extractExcelText(base64Data: string, fileName: string): Promise<ExtractFileResult> {
  // Dynamic import for xlsx (server-side only)
  const XLSX = (await import('xlsx')).default

  const { bytes } = base64ToBytes(base64Data)
  const workbook = XLSX.read(bytes, { type: 'array' })

  const textParts: string[] = []
  let totalRows = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csvText = XLSX.utils.sheet_to_csv(sheet)

    if (csvText.trim()) {
      textParts.push(`--- ${sheetName} ---`)
      textParts.push(csvText)
      totalRows += csvText.split('\n').length
    }
  }

  const fullText = textParts.join('\n\n')

  return {
    text: fullText,
    metadata: {
      title: fileName.replace(/\.(xlsx?|csv)$/i, ''),
      pageCount: workbook.SheetNames.length,
      wordCount: countWords(fullText),
    },
  }
}

// Extract text from Word documents
async function extractDocText(base64Data: string, fileName: string): Promise<ExtractFileResult> {
  // Dynamic import for mammoth (server-side only)
  const mammoth = (await import('mammoth')).default

  const { bytes } = base64ToBytes(base64Data)
  const buffer = Buffer.from(bytes)

  const result = await mammoth.extractRawText({ buffer })
  const text = result.value.trim()

  return {
    text,
    metadata: {
      title: fileName.replace(/\.(docx?|pptx?|key|pages)$/i, ''),
      wordCount: countWords(text),
    },
  }
}

// Extract text from Image via Gemini Vision OCR
async function extractImageText(base64Data: string, fileName: string): Promise<ExtractFileResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  // Extract base64 content without data URL prefix
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data format')
  }

  const mimeType = matches[1]
  const base64Content = matches[2]

  // Get current model from settings
  const currentModel = await getGeminiModel()
  const apiUrl = getGeminiApiUrl(currentModel)

  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Please extract ALL text from this image. If this is an infographic, diagram, or chart, also describe its key information and data points in a structured format. Return the extracted text in a readable format.`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Content,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini Vision API error: ${error}`)
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
        }>
      }
    }>
    usageMetadata?: {
      promptTokenCount?: number
      candidatesTokenCount?: number
    }
  }

  const result: GeminiResponse = await response.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Log AI usage
  try {
    await logAIUsage({
      data: {
        action: 'summarize', // Using summarize action type for OCR
        inputTokens: result.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
        model: `${currentModel}-vision`,
      },
    })
  } catch {
    console.error('Failed to log AI usage for OCR')
  }

  return {
    text: text.trim(),
    metadata: {
      title: fileName.replace(/\.(png|jpg|jpeg|gif|webp|svg)$/i, ''),
      wordCount: countWords(text),
    },
  }
}

// Main file extraction function
export const extractFile = createServerFn({ method: 'POST' })
  .inputValidator((data: ExtractFileInput) => data)
  .handler(async ({ data }): Promise<ExtractFileResult> => {
    switch (data.inputType) {
      case 'pdf':
        return extractPDFText(data.base64Data, data.fileName)
      case 'excel':
        return extractExcelText(data.base64Data, data.fileName)
      case 'doc':
        return extractDocText(data.base64Data, data.fileName)
      case 'image':
        return extractImageText(data.base64Data, data.fileName)
      default:
        throw new Error(`Unsupported file type: ${data.inputType}`)
    }
  })

// ============================================
// File Storage Functions
// ============================================

interface UploadExtractedFileInput {
  base64Data: string
  fileName: string
}

export const uploadExtractedFile = createServerFn({ method: 'POST' })
  .inputValidator((data: UploadExtractedFileInput) => data)
  .handler(async ({ data }): Promise<{ filePath: string }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { bytes, mimeType } = base64ToBytes(data.base64Data)

    // Generate unique file path: user_id/timestamp_filename
    const ext = data.fileName.split('.').pop() || 'bin'
    const filePath = `${user.id}/${Date.now()}_${data.fileName.replace(/\.[^/.]+$/, '')}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(EXTRACTED_FILES_BUCKET)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    return { filePath }
  })

export const deleteExtractedFile = createServerFn({ method: 'POST' })
  .inputValidator((data: { filePath: string }) => data)
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

    // Verify user owns this file
    if (!data.filePath.startsWith(user.id)) {
      throw new Error('Unauthorized to delete this file')
    }

    const { error: deleteError } = await supabase.storage
      .from(EXTRACTED_FILES_BUCKET)
      .remove([data.filePath])

    if (deleteError) {
      throw new Error(`Failed to delete file: ${deleteError.message}`)
    }

    return { success: true }
  })

// ============================================
// Database CRUD Functions
// ============================================

// Save extraction to database
export const saveExtraction = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<ExtractedContentInsert, 'user_id'>) => data)
  .handler(async ({ data }): Promise<ExtractedContent> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required to save extraction history')
    }

    // Note: extracted_contents table must be created via migration before use
    const client = getUntypedClient()
    const { data: record, error } = await client
      .from('extracted_contents')
      .insert({
        ...data,
        user_id: user.id,
        word_count: data.word_count || countWords(data.extracted_text),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save extraction: ${error.message}`)
    }

    return record as ExtractedContent
  })

// Get user's extraction history
interface GetHistoryInput {
  limit?: number
  offset?: number
  inputType?: ExtractionInputType
}

export const getExtractionHistory = createServerFn({ method: 'POST' })
  .inputValidator((data: GetHistoryInput) => data)
  .handler(async ({ data }): Promise<{ items: ExtractedContent[]; total: number }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { items: [], total: 0 }
    }

    const client = getUntypedClient()
    let query = client
      .from('extracted_contents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false })

    if (data.inputType) {
      query = query.eq('input_type', data.inputType)
    }

    if (data.limit) {
      query = query.limit(data.limit)
    }

    if (data.offset) {
      query = query.range(data.offset, data.offset + (data.limit || 10) - 1)
    }

    const { data: items, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`)
    }

    return {
      items: (items || []) as ExtractedContent[],
      total: count || 0,
    }
  })

// Get single extraction by ID
export const getExtractionById = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<ExtractedContent | null> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get the record
    const client = getUntypedClient()
    const { data: record, error } = await client
      .from('extracted_contents')
      .select('*')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch extraction: ${error.message}`)
    }

    // Update last_accessed_at
    await client
      .from('extracted_contents')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', data.id)

    return record as ExtractedContent
  })

// Update extraction with AI content
interface UpdateExtractionInput {
  id: string
  updates: ExtractedContentUpdate
}

export const updateExtraction = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateExtractionInput) => data)
  .handler(async ({ data }): Promise<ExtractedContent> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const client = getUntypedClient()
    const { data: record, error } = await client
      .from('extracted_contents')
      .update({
        ...data.updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update extraction: ${error.message}`)
    }

    return record as ExtractedContent
  })

// Delete extraction
export const deleteExtraction = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
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

    // Get the record first to check for file path
    const client = getUntypedClient()
    const { data: record } = await client
      .from('extracted_contents')
      .select('source_file_path')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    // Delete from storage if file exists
    if (record?.source_file_path) {
      await supabase.storage
        .from(EXTRACTED_FILES_BUCKET)
        .remove([record.source_file_path])
    }

    // Delete from database
    const { error } = await client
      .from('extracted_contents')
      .delete()
      .eq('id', data.id)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete extraction: ${error.message}`)
    }

    return { success: true }
  })

// Clear all extraction history
export const clearExtractionHistory = createServerFn({ method: 'POST' })
  .inputValidator(() => ({}))
  .handler(async (): Promise<{ success: boolean; deleted: number }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get all file paths first
    const client = getUntypedClient()
    const { data: records } = await client
      .from('extracted_contents')
      .select('source_file_path')
      .eq('user_id', user.id)
      .not('source_file_path', 'is', null)

    // Delete files from storage
    if (records && records.length > 0) {
      const filePaths = (records as Array<{ source_file_path: string | null }>)
        .map((r) => r.source_file_path)
        .filter((p): p is string => p !== null)

      if (filePaths.length > 0) {
        await supabase.storage.from(EXTRACTED_FILES_BUCKET).remove(filePaths)
      }
    }

    // Delete all records
    const { error, count } = await client
      .from('extracted_contents')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to clear history: ${error.message}`)
    }

    return { success: true, deleted: count || 0 }
  })
