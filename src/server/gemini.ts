import { createServerFn } from '@tanstack/react-start'
import type { GeneratedQuest } from '../types/database'
import { logAIUsage } from './admin-settings'
import { GEMINI_API_URL, GEMINI_MODEL } from './gemini-config'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// Helper function to clean and parse JSON from Gemini response
function cleanAndParseJSON(textContent: string): unknown {
  let cleanedContent = textContent.trim()

  // Remove markdown code blocks if present
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.slice(7)
  } else if (cleanedContent.startsWith('```')) {
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

  // 3. Remove any control characters that might break JSON
  cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') return char
    return ''
  })

  // 4. Fix unescaped quotes inside strings (common Gemini issue)
  // Look for patterns like "text "quoted" text" and escape inner quotes
  cleanedContent = cleanedContent.replace(
    /:\s*"([^"]*)"([^,}\]]*)"([^"]*)"(?=\s*[,}\]])/g,
    (match, before, middle, after) => {
      return `: "${before}\\"${middle}\\"${after}"`
    },
  )

  // 5. Fix broken strings with unescaped backslashes
  cleanedContent = cleanedContent.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')

  // 6. Fix unquoted property names (e.g., key: -> "key":)
  // Match property names at the start of lines or after { or ,
  cleanedContent = cleanedContent.replace(
    /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
    '$1"$2":',
  )

  // 7. Fix single quotes used instead of double quotes for property names
  cleanedContent = cleanedContent.replace(
    /([{,]\s*)'([^']+)'\s*:/g,
    '$1"$2":',
  )

  // 8. Fix single quotes used for string values
  // Be careful not to break apostrophes in text
  cleanedContent = cleanedContent.replace(
    /:\s*'([^']*)'/g,
    ': "$1"',
  )

  // 9. Try to extract valid JSON if there's extra content
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanedContent = jsonMatch[0]
  }

  // First attempt: try to parse directly
  try {
    return JSON.parse(cleanedContent)
  } catch (firstError) {
    // Second attempt: try more aggressive fixes

    // Fix multi-line strings by joining them
    cleanedContent = cleanedContent.replace(/"\s*\n\s*/g, ' ')

    // Remove any BOM or zero-width characters
    cleanedContent = cleanedContent.replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')

    // Try parsing again
    try {
      return JSON.parse(cleanedContent)
    } catch (secondError) {
      // Third attempt: try to use a more lenient approach
      // Replace problematic unicode quotes with regular quotes
      cleanedContent = cleanedContent
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")

      return JSON.parse(cleanedContent)
    }
  }
}

// Helper function to delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

interface GenerateQuestInput {
  content: string
  contentType: 'text' | 'pdf' | 'video_link'
  language: 'th' | 'en'
  outputType: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
  // Quiz types - can select multiple (multiple_choice, subjective, or both)
  quizTypes?: Array<'multiple_choice' | 'subjective'>
  choiceCount?: number
  questionCount?: number
  // Separate counts for mixed mode
  multipleChoiceCount?: number
  subjectiveCount?: number
  // Quest-specific settings
  stageCount?: number
  questionsPerStage?: number
  // Common settings
  tags?: Array<string>
  ageRange?: string
  // Easy Explain Mode (Feynman Technique)
  easyExplainEnabled?: boolean
}

export const generateQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: GenerateQuestInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const languageInstruction =
      data.language === 'th'
        ? 'Generate ALL content in Thai language (ภาษาไทย). Quest title, stage titles, lessons, questions, options, and explanations must ALL be in Thai.'
        : 'Generate ALL content in English language.'

    // Determine quiz format based on settings
    const quizTypes = data.quizTypes || ['multiple_choice']
    const includesMultipleChoice = quizTypes.includes('multiple_choice')
    const includesSubjective = quizTypes.includes('subjective')
    const isMixedMode = includesMultipleChoice && includesSubjective
    const choiceCount = data.choiceCount || 4
    const questionCount = data.questionCount || 10
    const stageCount = data.stageCount || 4
    const questionsPerStage = data.questionsPerStage || 3

    // Tags and age range instructions
    const tagsInstruction =
      data.tags && data.tags.length > 0
        ? `Use these exact tags: ${JSON.stringify(data.tags)}`
        : 'Generate 3-5 relevant tags that describe the content topic (lowercase, e.g., "physics", "newton\'s laws", "motion")'

    const ageRangeInstruction = data.ageRange && data.ageRange !== 'auto'
      ? `Target age range: ${data.ageRange}. Adjust language complexity and examples accordingly.`
      : 'Estimate the appropriate age range based on content complexity (choose from: 3-5, 6-9, 10-12, 13-17, 18+) and include it in the response as "age_range" field.'

    // Easy Explain Mode (Feynman Technique) instruction
    const easyExplainInstruction = data.easyExplainEnabled
      ? `
EASY EXPLAIN MODE (Feynman Technique) - IMPORTANT:
For ALL explanations, you MUST:
1. Use simple, everyday language - explain like teaching a curious child
2. Use analogies and metaphors from daily life (e.g., "think of it like a water pipe..." or "imagine a busy highway...")
3. Avoid technical jargon - if you must use it, explain it immediately with a simple comparison
4. Break down complex concepts into small, digestible pieces
5. Use concrete examples that anyone can relate to
6. Start with "why it matters" before explaining "what it is"
7. Make the explanation memorable and fun

Example of Easy Explain style:
- Instead of: "Photosynthesis is the process by which plants convert light energy into chemical energy"
- Write: "Plants are like tiny food factories! They catch sunlight (like catching rain in a bucket) and mix it with water and air to cook their own food. That's why plants need sunlight - they're basically solar-powered chefs!"
`
      : ''

    let quizFormatInstruction: string
    let quizJsonExample: string

    const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, choiceCount)
    const optionsExample = optionLetters.map((l) => `"Option ${l}"`).join(', ')

    const multipleChoiceExample = `{
          "question": "Question text?",
          "type": "multiple_choice",
          "options": [${optionsExample}],
          "correct_answer": 0,
          "explanation": "Brief explanation of why this answer is correct."
        }`

    const subjectiveExample = `{
          "question": "Explain in your own words...",
          "type": "subjective",
          "model_answer": "A comprehensive answer that covers the key points...",
          "explanation": "A good answer should include..."
        }`

    if (isMixedMode) {
      // Mixed mode: both multiple choice and subjective
      const mcCount = data.multipleChoiceCount
      const subjCount = data.subjectiveCount
      const mcInstruction = mcCount
        ? `Generate exactly ${mcCount} multiple choice questions.`
        : 'Generate multiple choice questions (AI decides the number).'
      const subjInstruction = subjCount
        ? `Generate exactly ${subjCount} subjective questions.`
        : 'Generate subjective questions (AI decides the number).'

      quizFormatInstruction = `Generate a mix of both multiple choice and subjective questions.
${mcInstruction}
${subjInstruction}
For multiple choice questions:
- Include exactly ${choiceCount} options
- The "correct_answer" field is the 0-based index
For subjective questions:
- Include a thought-provoking question
- Provide a model_answer`

      quizJsonExample = `${multipleChoiceExample},
    ${subjectiveExample}`
    } else if (includesSubjective) {
      // Only subjective
      quizFormatInstruction = `Generate subjective/open-ended questions where users write their own answers.
Each quiz should have:
- A thought-provoking question that requires written explanation
- A model answer that serves as the correct/expected response
- An explanation of what makes a good answer`

      quizJsonExample = subjectiveExample
    } else {
      // Only multiple choice (default)
      quizFormatInstruction = `Generate multiple choice questions with exactly ${choiceCount} options each.`

      quizJsonExample = multipleChoiceExample
    }

    let prompt: string

    if (data.outputType === 'quiz') {
      // Smart Quiz: Flat quizzes without stages
      prompt = `You are an educational quiz generator. Create quiz questions from the following content.

${languageInstruction}
${ageRangeInstruction}
${easyExplainInstruction}

Content to transform:
${data.content}

Generate exactly ${questionCount} quiz questions that test understanding of the key concepts.

${quizFormatInstruction}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Quiz Title",
  "type": "quiz",
  "tags": ["tag1", "tag2", "tag3"],
  "age_range": "estimated age range or provided age range",
  "quizzes": [
    ${quizJsonExample}
  ]
}

Rules:
- CRITICAL: All text content must be in ${data.language === 'th' ? 'Thai (ภาษาไทย)' : 'English'}
- ${tagsInstruction}
- Tags should be lowercase and help users find related quizzes
- Create engaging and clear questions appropriate for the target age
- Include helpful explanations for each answer
- Questions should cover different aspects of the content
${includesMultipleChoice ? `- For multiple choice: "correct_answer" is the 0-based index, exactly ${choiceCount} options` : ''}
${includesSubjective ? '- For subjective: provide a comprehensive model_answer' : ''}
- Generate exactly valid JSON, no markdown formatting`
    } else if (data.outputType === 'quest') {
      // Quest Course: Stages with lessons and quizzes
      prompt = `You are an educational content transformer. Transform the following content into a gamified learning quest.

${languageInstruction}
${ageRangeInstruction}
${easyExplainInstruction}

Content to transform:
${data.content}

Create a structured learning experience with exactly ${stageCount} stages. Each stage should have:
1. A catchy title
2. A brief lesson summary (2-3 sentences) that teaches the concept
3. Exactly ${questionsPerStage} quiz questions to test understanding

${quizFormatInstruction}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Quest Title",
  "type": "quest",
  "tags": ["tag1", "tag2", "tag3"],
  "age_range": "estimated age range or provided age range",
  "stages": [
    {
      "title": "Stage 1 Title",
      "lesson": "Brief summary of what this stage teaches...",
      "quizzes": [
        ${quizJsonExample}
      ]
    }
  ]
}

Rules:
- CRITICAL: All text content must be in ${data.language === 'th' ? 'Thai (ภาษาไทย)' : 'English'}
- ${tagsInstruction}
- Tags should be lowercase and help users find related quests
- Create exactly ${stageCount} stages with ${questionsPerStage} questions each
- Make the content engaging and fun, appropriate for the target age
- Each stage should teach a specific concept before testing it
- Include helpful explanations
- Ensure questions progressively build on concepts
${includesMultipleChoice ? `- For multiple choice: "correct_answer" is the 0-based index, exactly ${choiceCount} options` : ''}
${includesSubjective ? '- For subjective: provide a comprehensive model_answer' : ''}
- Generate exactly valid JSON, no markdown formatting`
    } else if (data.outputType === 'lesson') {
      // Lesson: Structured content modules without quizzes
      const moduleCount = data.stageCount || 3
      prompt = `You are an educational content creator. Transform the following content into a structured lesson with clear modules.

${languageInstruction}
${ageRangeInstruction}
${easyExplainInstruction}

Content to transform:
${data.content}

Create a well-structured lesson with exactly ${moduleCount} modules. Each module should:
1. Have a clear, descriptive title
2. Contain multiple content blocks (text, headings, lists)
3. Be organized logically to build understanding

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Lesson Title",
  "type": "lesson",
  "tags": ["tag1", "tag2", "tag3"],
  "age_range": "estimated age range or provided age range",
  "modules": [
    {
      "title": "Module 1 Title",
      "content_blocks": [
        {
          "type": "heading",
          "content": "Introduction",
          "metadata": { "level": 1 }
        },
        {
          "type": "text",
          "content": "Main explanation text goes here..."
        },
        {
          "type": "list",
          "content": "Key Points",
          "metadata": { "items": ["Point 1", "Point 2", "Point 3"] }
        }
      ]
    }
  ]
}

Content block types:
- "heading": Use for section titles (level 1-3)
- "text": Use for paragraphs and explanations
- "list": Use for bullet points (include items in metadata)

Rules:
- CRITICAL: All text content must be in ${data.language === 'th' ? 'Thai (ภาษาไทย)' : 'English'}
- ${tagsInstruction}
- Tags should be lowercase and help users find related lessons
- Create exactly ${moduleCount} modules
- Each module should focus on one main concept
- Use varied content blocks to make the lesson engaging
- Progress from basic to advanced concepts
- Generate exactly valid JSON, no markdown formatting`
    } else {
      throw new Error(`Unsupported output type: ${data.outputType}`)
    }

    // Determine action type based on outputType
    const actionMap = {
      quiz: 'generate_quiz',
      quest: 'generate_quest',
      lesson: 'generate_lesson',
      flashcard: 'generate_quiz',
      roleplay: 'generate_quest',
    } as const

    // Helper function to make a single API call
    const makeApiCall = async (): Promise<{ textContent: string; inputTokens: number; outputTokens: number }> => {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gemini API error: ${error}`)
      }

      const result: GeminiResponse = await response.json()
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textContent) {
        throw new Error('No content generated')
      }

      return {
        textContent,
        inputTokens: result.usageMetadata?.promptTokenCount || 0,
        outputTokens: result.usageMetadata?.candidatesTokenCount || 0,
      }
    }

    // Retry logic for JSON parsing errors
    let lastError: Error | null = null
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { textContent, inputTokens, outputTokens } = await makeApiCall()
        totalInputTokens += inputTokens
        totalOutputTokens += outputTokens

        // Try to parse the JSON
        const quest = cleanAndParseJSON(textContent) as GeneratedQuest

        // Log usage after successful parse
        try {
          await logAIUsage({
            data: {
              action: actionMap[data.outputType] || 'generate_quiz',
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              model: GEMINI_MODEL,
            },
          })
        } catch (error) {
          console.error('Failed to log AI usage:', error)
        }

        return quest
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Only retry on JSON parse errors, not API errors
        const isParseError =
          lastError.message.includes('JSON') ||
          lastError.message.includes('Unexpected token') ||
          lastError.message.includes('Expected')

        if (isParseError && attempt < MAX_RETRIES) {
          console.log(`JSON parse failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying...`)
          await delay(RETRY_DELAY_MS)
          continue
        }

        // Log usage even on failure
        if (totalInputTokens > 0 || totalOutputTokens > 0) {
          try {
            await logAIUsage({
              data: {
                action: actionMap[data.outputType] || 'generate_quiz',
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                model: GEMINI_MODEL,
              },
            })
          } catch (logError) {
            console.error('Failed to log AI usage:', logError)
          }
        }

        break
      }
    }

    console.error('All retry attempts failed:', lastError?.message)
    throw new Error(
      `Failed to generate valid content after ${MAX_RETRIES + 1} attempts. Please try again.`,
    )
  })
