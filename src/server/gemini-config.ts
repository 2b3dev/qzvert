/**
 * Gemini API Configuration
 *
 * The model is now configurable from Admin Settings.
 * This file provides helper functions to get the current model config.
 */

import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import { GEMINI_MODELS, type GeminiModelId } from '../types/database'

// API Base URL
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Default model (fallback)
export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-2.0-flash'

// Helper to get Supabase client
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Get current Gemini model from DB settings
export async function getGeminiModel(): Promise<GeminiModelId> {
  try {
    const supabase = getSupabaseFromCookies()
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'gemini_model')
      .single()

    if (data?.value) {
      return data.value as GeminiModelId
    }
  } catch {
    // Fallback to default if DB fetch fails
  }
  return DEFAULT_GEMINI_MODEL
}

// Get API URL for a specific model
export function getGeminiApiUrl(modelId: GeminiModelId): string {
  return `${GEMINI_API_BASE}/${modelId}:generateContent`
}

// Get model display name
export function getGeminiModelDisplayName(modelId: GeminiModelId): string {
  const model = GEMINI_MODELS.find(m => m.id === modelId)
  return model?.name || modelId
}

// For backward compatibility - these are still exported but should use getGeminiModel() in async contexts
export const GEMINI_MODEL = DEFAULT_GEMINI_MODEL
export const GEMINI_API_URL = getGeminiApiUrl(DEFAULT_GEMINI_MODEL)
export const GEMINI_MODEL_DISPLAY_NAME = getGeminiModelDisplayName(DEFAULT_GEMINI_MODEL)

// Re-export types and models list
export { GEMINI_MODELS, type GeminiModelId, type GeminiModelConfig } from '../types/database'
