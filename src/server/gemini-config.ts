/**
 * Gemini API Configuration
 *
 * Change the model here to switch between Gemini versions:
 * - gemini-2.0-flash (current)
 * - gemini-1.5-flash
 * - gemini-1.5-pro
 * - gemini-2.0-flash-exp (experimental)
 */

// Current Gemini model to use
export const GEMINI_MODEL = 'gemini-2.0-flash'

// API Base URL
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Full API URL for generateContent
export const GEMINI_API_URL = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`

// Model display name (for UI)
export const GEMINI_MODEL_DISPLAY_NAME = 'Gemini 2.0 Flash'
