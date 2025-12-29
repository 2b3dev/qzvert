import { createServerFn } from '@tanstack/react-start'
import type { GeneratedQuest } from '../types/database'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface SummarizeInput {
  content: string
  language: 'th' | 'en'
}

interface CraftInput {
  content: string
  language: 'th' | 'en'
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

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string): Promise<string> {
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

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content generated from Gemini')
  }

  return content
}

// Summarize content
export const summarizeContent = createServerFn({ method: 'POST' })
  .inputValidator((data: SummarizeInput) => data)
  .handler(async ({ data }) => {
    const languageInstruction =
      data.language === 'th'
        ? 'ตอบเป็นภาษาไทยเท่านั้น'
        : 'Respond in English only.'

    const prompt = `${languageInstruction}

Summarize the following content concisely. Keep the key points and main ideas.
Make it easy to understand but comprehensive.
Output in plain text only, no markdown formatting.

Content:
${data.content}

Summary:`

    const summary = await callGeminiAPI(prompt)

    return { summary: summary.trim() }
  })

// Craft content for learning
export const craftContent = createServerFn({ method: 'POST' })
  .inputValidator((data: CraftInput) => data)
  .handler(async ({ data }) => {
    const languageInstruction =
      data.language === 'th'
        ? 'ตอบเป็นภาษาไทยเท่านั้น'
        : 'Respond in English only.'

    const prompt = `${languageInstruction}

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

    const crafted = await callGeminiAPI(prompt)

    // Extract key points from the crafted content
    const keyPointsPrompt = `${languageInstruction}

Extract 3-5 main key points from this content as a JSON array of strings.
Return ONLY the JSON array, no other text.

Content:
${crafted}

JSON array of key points:`

    let keyPoints: Array<string> = []
    try {
      const keyPointsResponse = await callGeminiAPI(keyPointsPrompt)
      // Clean up response and parse JSON
      let cleaned = keyPointsResponse.trim()
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
      keyPoints = crafted
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 5)
    }

    return {
      crafted: crafted.trim(),
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

    const translated = await callGeminiAPI(prompt)

    return { translated: translated.trim() }
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

    const response = await callGeminiAPI(prompt)

    // Clean and parse JSON
    let cleanedContent = response.trim()
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7)
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3)
    }

    const lesson: GeneratedQuest = JSON.parse(cleanedContent.trim())

    return lesson
  })
