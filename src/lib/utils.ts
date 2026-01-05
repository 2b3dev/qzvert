import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contact email from environment variable
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@qzvert.com'

/**
 * Estimate token count from text
 * - English: ~4 characters per token
 * - Thai: ~1.5 characters per token (uses more tokens)
 *
 * Note: This is an approximation. Actual token count depends on the tokenizer.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  // Count Thai characters (Unicode range: \u0E00-\u0E7F)
  const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length
  const totalChars = text.length
  const thaiRatio = totalChars > 0 ? thaiChars / totalChars : 0

  // Weighted calculation based on Thai ratio
  // Thai: ~1.5 chars/token, English: ~4 chars/token
  const avgCharsPerToken = thaiRatio * 1.5 + (1 - thaiRatio) * 4

  return Math.ceil(totalChars / avgCharsPerToken)
}

/**
 * Estimate credits needed for an AI action
 * Uses token estimation ratios:
 * - summarize: 40% (output is shorter)
 * - lesson: 100% (full expansion)
 * - translate: 100% (same length)
 * - easyExplain: +20% modifier
 */
export function estimateCredits(
  text: string,
  action: 'summarize' | 'lesson' | 'translate',
  tokensPerCredit: number = 500,
  easyExplainEnabled: boolean = false
): { inputTokens: number; outputTokens: number; totalTokens: number; credits: number } {
  const inputTokens = estimateTokens(text)

  // Output ratio based on action type
  const outputRatios = {
    summarize: 0.4,  // 40% - summary is shorter
    lesson: 1.0,     // 100% - full content
    translate: 1.0,  // 100% - same length
  }

  let outputTokens = Math.ceil(inputTokens * outputRatios[action])

  // Easy explain adds 20% more output
  if (easyExplainEnabled) {
    outputTokens = Math.ceil(outputTokens * 1.2)
  }

  const totalTokens = inputTokens + outputTokens
  const credits = Math.max(1, Math.ceil(totalTokens / tokensPerCredit))

  return { inputTokens, outputTokens, totalTokens, credits }
}
