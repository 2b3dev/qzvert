import { motion } from 'framer-motion'
import { FileText, ImageIcon, Tag, X } from 'lucide-react'
import { ImageInput } from '../ui/image-input'
import { Input } from '../ui/input'
import { RichTextEditor } from '../ui/rich-text-editor'

interface BasicInfoSectionProps {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (description: string) => void
  thumbnail: string
  setThumbnail: (thumbnail: string) => void
  tags: string[]
  setTags: React.Dispatch<React.SetStateAction<string[]>>
  tagInput: string
  setTagInput: (input: string) => void
}

export function BasicInfoSection({
  title,
  setTitle,
  description,
  setDescription,
  thumbnail,
  setThumbnail,
  tags,
  setTags,
  tagInput,
  setTagInput,
}: BasicInfoSectionProps) {
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <label className="text-sm font-medium text-foreground mb-2 block">
          Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title..."
          className="text-lg font-semibold"
        />
      </motion.div>

      {/* Description & Thumbnail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-6 grid grid-cols-1 md:grid-cols-[1fr,280px] gap-6"
      >
        <div className="flex gap-4">
          <div className="w-[263px] relative">
            <label className="text-sm font-medium text-foreground mb-2 block">
              <ImageIcon className="w-4 h-4 inline-block mr-1" />
              Thumbnail
            </label>
            <ImageInput
              value={thumbnail}
              onChange={setThumbnail}
              placeholder="Add a thumbnail image"
              aspectRatio="video"
              maxSizeMB={1}
              recommendedSize="1200 x 630 px"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              <FileText className="w-4 h-4 inline-block mr-1" />
              Description
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add a description..."
            />
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <label className="text-sm font-medium text-foreground mb-2 block">
          <Tag className="w-4 h-4 inline-block mr-1" />
          Tags
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-secondary/30 min-h-[48px]">
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-primary/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={
              tags.length === 0 ? 'Add tags (press Enter or comma)' : ''
            }
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter or comma to add a tag. Backspace to remove last tag.
        </p>
      </motion.div>
    </>
  )
}
