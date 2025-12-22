import { createServerFn } from '@tanstack/react-start'
import type { GeneratedQuest } from '../types/database'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GenerateQuestInput {
  content: string
  contentType: 'text' | 'pdf' | 'video_link'
}

export const generateQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: GenerateQuestInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const prompt = `You are an educational content transformer. Transform the following content into a gamified learning quest.

Content to transform:
${data.content}

Create a structured learning experience with 3-5 stages. Each stage should have:
1. A catchy title
2. A brief lesson summary (2-3 sentences)
3. 2-4 quiz questions with multiple choice answers

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "title": "Quest Title",
  "stages": [
    {
      "title": "Stage 1 Title",
      "lesson": "Brief summary of what this stage teaches...",
      "quizzes": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "explanation": "Brief explanation of why this answer is correct and a funny pun related to the topic."
        }
      ]
    }
  ]
}

Rules:
- Make the content engaging and fun
- Include puns or humor in the explanations for wrong answers
- Ensure questions progressively build on concepts
- The "answer" field is the 0-based index of the correct option
- Generate exactly valid JSON, no markdown formatting`

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
