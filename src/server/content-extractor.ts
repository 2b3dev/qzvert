import { createServerFn } from '@tanstack/react-start'
import { GEMINI_API_URL } from './gemini-config'

// Input type detection result
export type InputType =
  | 'text'
  | 'youtube'
  | 'web'
  | 'pdf'
  | 'excel'
  | 'doc'
  | 'image'
  | 'unknown'

interface DetectInputResult {
  type: InputType
  url?: string
  content?: string
}

interface ExtractContentInput {
  input: string
  type?: InputType
}

interface ExtractContentResult {
  type: InputType
  content: string
  metadata?: {
    title?: string
    author?: string
    duration?: string
    pageCount?: number
    imageDescription?: string
  }
}

// URL patterns for detection
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[\w-]+/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
]

const WEB_URL_PATTERN = /^https?:\/\/[^\s]+$/

// File extension patterns (for base64 data URLs or file names)
const FILE_PATTERNS: Record<string, InputType> = {
  pdf: 'pdf',
  xlsx: 'excel',
  xls: 'excel',
  csv: 'excel',
  doc: 'doc',
  docx: 'doc',
  ppt: 'doc',
  pptx: 'doc',
  key: 'doc', // Keynote
  pages: 'doc', // Apple Pages
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
}

// Detect input type from string
export function detectInputType(input: string): DetectInputResult {
  const trimmed = input.trim()

  // Check if it's a YouTube URL
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: 'youtube', url: trimmed }
    }
  }

  // Check if it's a data URL (file upload)
  if (trimmed.startsWith('data:')) {
    const mimeMatch = trimmed.match(/^data:([^;]+);/)
    if (mimeMatch) {
      const mime = mimeMatch[1].toLowerCase()
      if (mime.includes('pdf')) return { type: 'pdf', content: trimmed }
      if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
        return { type: 'excel', content: trimmed }
      if (mime.includes('word') || mime.includes('document') || mime.includes('presentation'))
        return { type: 'doc', content: trimmed }
      if (mime.includes('image'))
        return { type: 'image', content: trimmed }
    }
  }

  // Check if it's a file name/path
  const extMatch = trimmed.match(/\.(\w+)$/i)
  if (extMatch) {
    const ext = extMatch[1].toLowerCase()
    const type = FILE_PATTERNS[ext]
    if (type) {
      return { type, content: trimmed }
    }
  }

  // Check if it's a web URL (not YouTube)
  if (WEB_URL_PATTERN.test(trimmed)) {
    return { type: 'web', url: trimmed }
  }

  // Default to plain text
  return { type: 'text', content: trimmed }
}

// Extract video ID from YouTube URL
function extractYoutubeVideoId(url: string): string | null {
  // Standard watch URL
  let match = url.match(/[?&]v=([^&]+)/)
  if (match) return match[1]

  // Short URL (youtu.be)
  match = url.match(/youtu\.be\/([^?&]+)/)
  if (match) return match[1]

  // Embed URL
  match = url.match(/embed\/([^?&]+)/)
  if (match) return match[1]

  // Shorts URL
  match = url.match(/shorts\/([^?&]+)/)
  if (match) return match[1]

  return null
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number.parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
}

// Extract YouTube video metadata from page
async function extractYoutubeMetadata(videoId: string): Promise<{
  title?: string
  description?: string
  channel?: string
  duration?: string
}> {
  const videoPageResponse = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
      },
    },
  )

  if (!videoPageResponse.ok) {
    throw new Error('Failed to fetch YouTube page')
  }

  const html = await videoPageResponse.text()

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/)
  const title = titleMatch
    ? decodeHtmlEntities(titleMatch[1].replace(' - YouTube', '').trim())
    : undefined

  // Extract description from meta tag
  const descMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
  )
  const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : undefined

  // Extract channel name
  const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/)
  const channel = channelMatch ? decodeHtmlEntities(channelMatch[1]) : undefined

  // Extract duration
  const durationMatch = html.match(/"lengthSeconds":"(\d+)"/)
  const duration = durationMatch
    ? formatDuration(Number.parseInt(durationMatch[1], 10))
    : undefined

  return { title, description, channel, duration }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Use Gemini to generate content from YouTube metadata when no transcript
async function generateContentFromMetadata(metadata: {
  title?: string
  description?: string
  channel?: string
  duration?: string
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const prompt = `Based on this YouTube video information, create a comprehensive summary of what the video is likely about. Write in the same language as the title.

Video Title: ${metadata.title || 'Unknown'}
Channel: ${metadata.channel || 'Unknown'}
Duration: ${metadata.duration || 'Unknown'}
Description: ${metadata.description || 'No description available'}

Please provide:
1. A detailed summary of the video topic (2-3 paragraphs)
2. Key points that are likely covered in the video
3. What viewers will learn from this video

Write naturally as if summarizing the actual video content. Be informative and educational.`

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
        maxOutputTokens: 2048,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const result = await response.json()
  const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!textContent) {
    throw new Error('Failed to generate content from metadata')
  }

  return textContent
}

// Fetch YouTube transcript using youtube-transcript library approach
async function fetchYoutubeTranscript(url: string): Promise<{
  content: string
  metadata: { title?: string; duration?: string }
}> {
  const videoId = extractYoutubeVideoId(url)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  try {
    // First, get the video metadata
    const metadata = await extractYoutubeMetadata(videoId)

    // Try to fetch the video page for transcript
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
        },
      },
    )

    if (!videoPageResponse.ok) {
      // Fallback to Gemini if page fetch fails
      console.log('Failed to fetch YouTube page, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    const html = await videoPageResponse.text()

    // Try to find captions/transcript data in the page
    const playerResponseMatch = html.match(
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
    )

    if (!playerResponseMatch) {
      // No player response, use Gemini fallback
      console.log('No player response found, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    let playerResponse
    try {
      playerResponse = JSON.parse(playerResponseMatch[1])
    } catch {
      // Parse error, use Gemini fallback
      console.log('Failed to parse player response, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks

    if (!captionTracks || captionTracks.length === 0) {
      // No captions available, use Gemini fallback
      console.log('No captions available, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    // Prefer Thai or English captions
    let selectedTrack = captionTracks.find(
      (track: { languageCode: string }) =>
        track.languageCode === 'th' || track.languageCode === 'th-TH',
    )
    if (!selectedTrack) {
      selectedTrack = captionTracks.find(
        (track: { languageCode: string }) =>
          track.languageCode === 'en' || track.languageCode === 'en-US',
      )
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks[0] // Fallback to first available
    }

    // Fetch the transcript XML
    const transcriptResponse = await fetch(selectedTrack.baseUrl)
    if (!transcriptResponse.ok) {
      // Transcript fetch failed, use Gemini fallback
      console.log('Failed to fetch transcript, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    const transcriptXml = await transcriptResponse.text()

    // Parse the XML transcript
    const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)
    const transcriptParts: string[] = []

    for (const match of textMatches) {
      // Decode HTML entities
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim()

      if (text) {
        transcriptParts.push(text)
      }
    }

    if (transcriptParts.length === 0) {
      // Empty transcript, use Gemini fallback
      console.log('Transcript is empty, using Gemini fallback')
      const generatedContent = await generateContentFromMetadata(metadata)
      return {
        content: generatedContent,
        metadata: { title: metadata.title, duration: metadata.duration },
      }
    }

    return {
      content: transcriptParts.join(' '),
      metadata: { title: metadata.title, duration: metadata.duration },
    }
  } catch (error) {
    console.error('YouTube transcript error:', error)

    // Last resort: try Gemini fallback
    try {
      const videoId = extractYoutubeVideoId(url)
      if (videoId) {
        const metadata = await extractYoutubeMetadata(videoId)
        const generatedContent = await generateContentFromMetadata(metadata)
        return {
          content: generatedContent,
          metadata: { title: metadata.title, duration: metadata.duration },
        }
      }
    } catch (fallbackError) {
      console.error('Gemini fallback also failed:', fallbackError)
    }

    throw error
  }
}

// Fetch and extract content from a web page
async function fetchWebContent(url: string): Promise<{
  content: string
  metadata: { title?: string; author?: string }
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : undefined

    // Extract author from meta tags
    const authorMatch = html.match(
      /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    )
    const author = authorMatch ? authorMatch[1].trim() : undefined

    // Extract main content - prioritize article/main content areas
    let content = ''

    // Try to find article content first
    const articleMatch = html.match(
      /<article[^>]*>([\s\S]*?)<\/article>/i,
    )
    if (articleMatch) {
      content = articleMatch[1]
    } else {
      // Try main content area
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (mainMatch) {
        content = mainMatch[1]
      } else {
        // Fallback to body
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (bodyMatch) {
          content = bodyMatch[1]
        }
      }
    }

    // Remove script and style tags
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

    // Extract text from paragraphs and headings
    const textParts: string[] = []

    // Get headings
    const headings = content.matchAll(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi)
    for (const match of headings) {
      const text = match[1].trim()
      if (text) textParts.push(text)
    }

    // Get paragraphs
    const paragraphs = content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
    for (const match of paragraphs) {
      // Strip remaining HTML tags
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text && text.length > 20) {
        // Filter out short fragments
        textParts.push(text)
      }
    }

    // Get list items if not much paragraph content
    if (textParts.length < 3) {
      const listItems = content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
      for (const match of listItems) {
        const text = match[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (text) textParts.push(text)
      }
    }

    const extractedContent = textParts.join('\n\n')

    if (!extractedContent || extractedContent.length < 50) {
      throw new Error(
        'Could not extract meaningful content from this page. Try copying the text manually.',
      )
    }

    return {
      content: extractedContent,
      metadata: { title, author },
    }
  } catch (error) {
    console.error('Web content extraction error:', error)
    throw error
  }
}

// Server function to detect input type
export const detectInput = createServerFn({ method: 'POST' })
  .inputValidator((data: { input: string }) => data)
  .handler(async ({ data }) => {
    return detectInputType(data.input)
  })

// Server function to extract content from various sources
export const extractContent = createServerFn({ method: 'POST' })
  .inputValidator((data: ExtractContentInput) => data)
  .handler(async ({ data }): Promise<ExtractContentResult> => {
    const detected = data.type
      ? { type: data.type, url: data.input, content: data.input }
      : detectInputType(data.input)

    switch (detected.type) {
      case 'youtube': {
        if (!detected.url) {
          throw new Error('YouTube URL is required')
        }
        const result = await fetchYoutubeTranscript(detected.url)
        return {
          type: 'youtube',
          content: result.content,
          metadata: result.metadata,
        }
      }

      case 'web': {
        if (!detected.url) {
          throw new Error('Web URL is required')
        }
        const result = await fetchWebContent(detected.url)
        return {
          type: 'web',
          content: result.content,
          metadata: result.metadata,
        }
      }

      case 'pdf':
      case 'excel':
      case 'doc':
      case 'image':
        // These require file upload handling - will be implemented separately
        // For now, return an error message
        throw new Error(
          `${detected.type.toUpperCase()} extraction requires file upload. This feature is coming soon.`,
        )

      case 'text':
      default:
        return {
          type: 'text',
          content: detected.content || data.input,
        }
    }
  })

// Helper to check if input looks like a URL that can be processed
export function isProcessableUrl(input: string): boolean {
  const detected = detectInputType(input)
  return detected.type === 'youtube' || detected.type === 'web'
}
