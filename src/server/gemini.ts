import { createServerFn } from '@tanstack/react-start'
import type { GeneratedQuest } from '../types/database'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GenerateQuestInput {
  content: string
  contentType: 'text' | 'pdf' | 'video_link'
  language: 'th' | 'en'
  outputType: 'quiz' | 'quest' | 'flashcard' | 'roleplay'
  // Quiz types - can select multiple (multiple_choice, subjective, or both)
  quizTypes?: ('multiple_choice' | 'subjective')[]
  choiceCount?: number
  questionCount?: number
  // Separate counts for mixed mode
  multipleChoiceCount?: number
  subjectiveCount?: number
  // Quest-specific settings
  stageCount?: number
  questionsPerStage?: number
  // Common settings
  tags?: string[]
  ageRange?: string
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
    const quizTypes = data.quizTypes || ['multiple_choice']
    const includesMultipleChoice = quizTypes.includes('multiple_choice')
    const includesSubjective = quizTypes.includes('subjective')
    const isMixedMode = includesMultipleChoice && includesSubjective
    const choiceCount = data.choiceCount || 4
    const questionCount = data.questionCount || 10
    const stageCount = data.stageCount || 4
    const questionsPerStage = data.questionsPerStage || 3

    // Tags and age range instructions
    const tagsInstruction = data.tags && data.tags.length > 0
      ? `Use these exact tags: ${JSON.stringify(data.tags)}`
      : 'Generate 3-5 relevant tags that describe the content topic (lowercase, e.g., "physics", "newton\'s laws", "motion")'

    const ageRangeInstruction = data.ageRange
      ? `Target age range: ${data.ageRange}. Adjust language complexity and examples accordingly.`
      : 'Estimate the appropriate age range based on content complexity and include it in the response as "age_range" field.'

    let quizFormatInstruction: string
    let quizJsonExample: string

    const optionLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, choiceCount)
    const optionsExample = optionLetters.map(l => `"Option ${l}"`).join(', ')

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
      const mcInstruction = mcCount ? `Generate exactly ${mcCount} multiple choice questions.` : 'Generate multiple choice questions (AI decides the number).'
      const subjInstruction = subjCount ? `Generate exactly ${subjCount} subjective questions.` : 'Generate subjective questions (AI decides the number).'

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
    } else {
      // Quest Course: Stages with lessons and quizzes
      prompt = `You are an educational content transformer. Transform the following content into a gamified learning quest.

${languageInstruction}
${ageRangeInstruction}

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
