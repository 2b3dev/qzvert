import { createServerFn } from '@tanstack/react-start'
import type { GeneratedQuest } from '../types/database'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GenerateQuestInput {
  content: string
  contentType: 'text' | 'pdf' | 'video_link'
  language: 'th' | 'en'
  outputType: 'quiz' | 'quest' | 'flashcard' | 'roleplay'
  quizType?: 'multiple_choice' | 'subjective'
  choiceCount?: number
  questionCount?: number
}

export const generateQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: GenerateQuestInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const languageInstruction = data.language === 'th'
      ? 'Generate ALL content in Thai language (ภาษาไทย). Quest title, stage titles, lessons, questions, options, and explanations must ALL be in Thai.'
      : 'Generate ALL content in English language.'

    // Determine quiz format based on settings
    const isSubjective = data.outputType === 'quiz' && data.quizType === 'subjective'
    const choiceCount = data.choiceCount || 4
    const questionCount = data.questionCount || 10

    let quizFormatInstruction: string
    let quizJsonExample: string

    if (isSubjective) {
      quizFormatInstruction = `Generate subjective/open-ended questions where users write their own answers.
Each quiz should have:
- A thought-provoking question that requires written explanation
- A model answer that serves as the correct/expected response
- An explanation of what makes a good answer`

      quizJsonExample = `{
          "question": "Explain in your own words...",
          "type": "subjective",
          "model_answer": "A comprehensive answer that covers the key points...",
          "explanation": "A good answer should include..."
        }`
    } else {
      quizFormatInstruction = `Generate multiple choice questions with exactly ${choiceCount} options each.`

      const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, choiceCount)
      const optionsExample = optionLetters.map(l => `"Option ${l}"`).join(', ')

      quizJsonExample = `{
          "question": "Question text?",
          "type": "multiple_choice",
          "options": [${optionsExample}],
          "correct_answer": 0,
          "explanation": "Brief explanation of why this answer is correct."
        }`
    }

    let prompt: string

    if (data.outputType === 'quiz') {
      // Smart Quiz: Flat quizzes without stages
      prompt = `You are an educational quiz generator. Create quiz questions from the following content.

${languageInstruction}

Content to transform:
${data.content}

Generate exactly ${questionCount} quiz questions that test understanding of the key concepts.

${quizFormatInstruction}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Quiz Title",
  "type": "smart_quiz",
  "tags": ["tag1", "tag2", "tag3"],
  "quizzes": [
    ${quizJsonExample}
  ]
}

Rules:
- CRITICAL: All text content must be in ${data.language === 'th' ? 'Thai (ภาษาไทย)' : 'English'}
- Generate 3-5 relevant tags that describe the quiz topic/content (e.g., "physics", "newton's laws", "motion")
- Tags should be lowercase and help users find related quizzes
- Create engaging and clear questions
- Include helpful explanations for each answer
- Questions should cover different aspects of the content
${!isSubjective ? `- The "correct_answer" field is the 0-based index of the correct option
- Each question must have exactly ${choiceCount} options` : '- For subjective questions, provide a comprehensive model_answer'}
- Generate exactly valid JSON, no markdown formatting`
    } else {
      // Quest Course: Stages with lessons and quizzes
      prompt = `You are an educational content transformer. Transform the following content into a gamified learning quest.

${languageInstruction}

Content to transform:
${data.content}

Create a structured learning experience with 3-5 stages. Each stage should have:
1. A catchy title
2. A brief lesson summary (2-3 sentences) that teaches the concept
3. 2-4 quiz questions to test understanding

${quizFormatInstruction}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Quest Title",
  "type": "quest_course",
  "tags": ["tag1", "tag2", "tag3"],
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
- Generate 3-5 relevant tags that describe the quest topic/content (e.g., "physics", "newton's laws", "motion")
- Tags should be lowercase and help users find related quests
- Make the content engaging and fun
- Each stage should teach a specific concept before testing it
- Include helpful explanations
- Ensure questions progressively build on concepts
${!isSubjective ? `- The "correct_answer" field is the 0-based index of the correct option
- Each question must have exactly ${choiceCount} options` : '- For subjective questions, provide a comprehensive model_answer'}
- Generate exactly valid JSON, no markdown formatting`
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const result = await response.json()
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      throw new Error('No content generated')
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = textContent.trim()
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7)
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    cleanedContent = cleanedContent.trim()

    const quest: GeneratedQuest = JSON.parse(cleanedContent)
    return quest
  })
