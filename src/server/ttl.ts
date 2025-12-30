import { createServerFn } from '@tanstack/react-start'
import type { AIAction, GeneratedQuest } from '../types/database'
import { logAIUsage } from './admin-settings'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// Interface for Gemini API response with usage metadata
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
    totalTokenCount?: number
  }
}

interface SummarizeInput {
  content: string
  language: 'th' | 'en'
  easyExplainEnabled?: boolean
}

interface CraftInput {
  content: string
  language: 'th' | 'en'
  easyExplainEnabled?: boolean
}

interface DeepLessonInput {
  topic: string
  content: string
  language: 'th' | 'en'
}

interface TranslateInput {
  content: string
  targetLanguage: string
}

// Result from Gemini API call with usage metadata
interface GeminiCallResult {
  content: string
  inputTokens: number
  outputTokens: number
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string): Promise<GeminiCallResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const result: GeminiResponse = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content generated from Gemini')
  }

  return {
    content,
    inputTokens: result.usageMetadata?.promptTokenCount || 0,
    outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
  }
}

// Helper to log usage after API call
async function logUsage(
  action: AIAction,
  inputTokens: number,
  outputTokens: number,
) {
  try {
    await logAIUsage({
      data: {
        action,
        inputTokens,
        outputTokens,
        model: 'gemini-2.0-flash',
      },
    })
  } catch (error) {
    // Don't fail the main request if logging fails
    console.error('Failed to log AI usage:', error)
  }
}

// Summarize content
export const summarizeContent = createServerFn({ method: 'POST' })
  .inputValidator((data: SummarizeInput) => data)
  .handler(async ({ data }) => {
    const languageInstruction =
      data.language === 'th'
        ? 'ตอบเป็นภาษาไทยเท่านั้น'
        : 'Respond in English only.'

    // Easy Explain Mode (Feynman Technique) instruction
    const easyExplainInstruction = data.easyExplainEnabled
      ? `
EASY EXPLAIN MODE (Feynman Technique) - IMPORTANT:
You MUST explain concepts using:
1. Simple, everyday language - like teaching a curious child
2. Analogies and metaphors from daily life (e.g., "think of it like a water pipe..." or "imagine a busy highway...")
3. Avoid technical jargon - if you must use it, explain it immediately with a simple comparison
4. Concrete examples that anyone can relate to
5. Start with "why it matters" before explaining "what it is"
6. Make the explanation memorable and fun

Example style:
- Instead of: "Photosynthesis is the process by which plants convert light energy into chemical energy"
- Write: "Plants are like tiny food factories! They catch sunlight and mix it with water and air to cook their own food. That's why plants need sunlight - they're basically solar-powered chefs!"
`
      : ''

    const prompt = `${languageInstruction}
${easyExplainInstruction}
Summarize the following content concisely. Keep the key points and main ideas.
Make it easy to understand but comprehensive.
Output in plain text only, no markdown formatting.

Content:
${data.content}

Summary:`

    const result = await callGeminiAPI(prompt)

    // Log usage
    await logUsage('summarize', result.inputTokens, result.outputTokens)

    return { summary: result.content.trim() }
  })

// Craft content for learning
export const craftContent = createServerFn({ method: 'POST' })
  .inputValidator((data: CraftInput) => data)
  .handler(async ({ data }) => {
    const languageInstruction =
      data.language === 'th'
        ? 'ตอบเป็นภาษาไทยเท่านั้น'
        : 'Respond in English only.'

    // Easy Explain Mode (Feynman Technique) instruction
    const easyExplainInstruction = data.easyExplainEnabled
      ? `
EASY EXPLAIN MODE (Feynman Technique) - IMPORTANT:
You MUST explain ALL concepts using:
1. Simple, everyday language - like teaching a curious child
2. Analogies and metaphors from daily life (e.g., "think of it like a water pipe..." or "imagine a busy highway...")
3. Avoid technical jargon - if you must use it, explain it immediately with a simple comparison
4. Break down complex concepts into small, digestible pieces
5. Concrete examples that anyone can relate to
6. Start with "why it matters" before explaining "what it is"
7. Make the explanation memorable and fun

Example style:
- Instead of: "Photosynthesis is the process by which plants convert light energy into chemical energy"
- Write: "Plants are like tiny food factories! They catch sunlight and mix it with water and air to cook their own food. That's why plants need sunlight - they're basically solar-powered chefs!"
`
      : ''

    const prompt = `${languageInstruction}
${easyExplainInstruction}
Restructure the following content for effective learning.
Format it with:
- Clear section headings (use simple text, no markdown #)
- Key concepts highlighted
- Bullet points for lists (use - or •)
- Short paragraphs for easy reading

Output as plain readable text, suitable for text-to-speech.

Content:
${data.content}

Structured Learning Content:`

    const craftResult = await callGeminiAPI(prompt)
    let totalInputTokens = craftResult.inputTokens
    let totalOutputTokens = craftResult.outputTokens

    // Extract key points from the crafted content
    const keyPointsPrompt = `${languageInstruction}

Extract 3-5 main key points from this content as a JSON array of strings.
Return ONLY the JSON array, no other text.

Content:
${craftResult.content}

JSON array of key points:`

    let keyPoints: Array<string> = []
    try {
      const keyPointsResult = await callGeminiAPI(keyPointsPrompt)
      totalInputTokens += keyPointsResult.inputTokens
      totalOutputTokens += keyPointsResult.outputTokens

      // Clean up response and parse JSON
      let cleaned = keyPointsResult.content.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7)
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3)
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3)
      }
      keyPoints = JSON.parse(cleaned.trim())
    } catch {
      // If parsing fails, create key points from first few sentences
      keyPoints = craftResult.content
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 5)
    }

    // Log usage
    await logUsage('craft', totalInputTokens, totalOutputTokens)

    return {
      crafted: craftResult.content.trim(),
      keyPoints,
    }
  })

// Translate content
export const translateContent = createServerFn({ method: 'POST' })
  .inputValidator((data: TranslateInput) => data)
  .handler(async ({ data }) => {
    const languageNames: Record<string, string> = {
      th: 'Thai',
      en: 'English',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      ru: 'Russian',
      vi: 'Vietnamese',
      id: 'Indonesian',
    }

    const targetLangName = languageNames[data.targetLanguage] || 'English'

    const prompt = `Translate the following content to ${targetLangName}.
Keep the same tone and style. Output only the translated text, no explanations.

Content:
${data.content}

Translation:`

    const result = await callGeminiAPI(prompt)

    // Log usage
    await logUsage('translate', result.inputTokens, result.outputTokens)

    return { translated: result.content.trim() }
  })

// Generate deep lesson
export const generateDeepLesson = createServerFn({ method: 'POST' })
  .inputValidator((data: DeepLessonInput) => data)
  .handler(async ({ data }) => {
    const languageInstruction =
      data.language === 'th'
        ? 'สร้างเนื้อหาทั้งหมดเป็นภาษาไทย'
        : 'Generate all content in English.'

    const prompt = `${languageInstruction}

Create a comprehensive lesson about this topic. Structure it as multiple modules with clear explanations, examples, and key takeaways.

Topic: ${data.topic || 'Based on content below'}

Content to expand upon:
${data.content}

Return as JSON in this exact format:
{
  "title": "Lesson Title",
  "type": "lesson",
  "tags": ["tag1", "tag2", "tag3"],
  "age_range": "estimated age range",
  "modules": [
    {
      "title": "Module 1 Title",
      "content_blocks": [
        { "type": "heading", "content": "Section Heading" },
        { "type": "text", "content": "Explanation paragraph..." },
        { "type": "list", "content": ["Point 1", "Point 2", "Point 3"] },
        { "type": "text", "content": "Another paragraph with examples..." }
      ]
    },
    {
      "title": "Module 2 Title",
      "content_blocks": [
        { "type": "heading", "content": "Next Section" },
        { "type": "text", "content": "More detailed content..." }
      ]
    }
  ]
}

IMPORTANT:
- Create 3-5 modules that progressively build understanding
- Each module should have 3-5 content blocks
- Include real examples and practical applications
- End with key takeaways or summary
- Respond ONLY with valid JSON, no markdown or other text`

    const result = await callGeminiAPI(prompt)

    // Log usage
    await logUsage('deep_lesson', result.inputTokens, result.outputTokens)

    // Clean and parse JSON
    let cleanedContent = result.content.trim()
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7)
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    cleanedContent = cleanedContent.trim()

    // Try to fix common JSON issues from Gemini
    // 1. Remove trailing commas before ] or }
    cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1')
    // 2. Fix unescaped newlines in strings
    cleanedContent = cleanedContent.replace(
      /"([^"]*(?:\\.[^"]*)*)"/g,
      (match) => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r'),
    )
    // 3. Remove control characters
    cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n' || char === '\r' || char === '\t') return char
      return ''
    })

    try {
      const lesson: GeneratedQuest = JSON.parse(cleanedContent)
      return lesson
    } catch (parseError) {
      console.error('JSON Parse Error. Raw content:', cleanedContent.slice(0, 500))
      throw new Error(
        'Failed to parse AI response. The AI returned invalid JSON. Please try again.',
      )
    }
  })
