import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Save,
  Send,
  Settings,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../../components/layouts/AdminLayout'
import { Button } from '../../../components/ui/button'
import { DateTimePicker } from '../../../components/ui/date-time-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { ImageInput } from '../../../components/ui/image-input'
import { Input } from '../../../components/ui/input'
import { RichTextEditor } from '../../../components/ui/rich-text-editor'
import { cn } from '../../../lib/utils'
import { checkAdminAccess } from '../../../server/admin-activities'
import { getCategories } from '../../../server/categories'
import {
  createPost,
  deletePost,
  getAdminPostById,
  updatePost,
} from '../../../server/posts'
import type {
  PostInsert,
  PostStatus,
  PostUpdate,
} from '../../../types/database'

const POST_STATUS_OPTIONS: {
  value: PostStatus
  label: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    value: 'draft',
    label: 'Draft',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-muted-foreground',
  },
  {
    value: 'published',
    label: 'Published',
    icon: <Send className="w-4 h-4" />,
    color: 'text-emerald-500',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-blue-500',
  },
  {
    value: 'archived',
    label: 'Archived',
    icon: <Archive className="w-4 h-4" />,
    color: 'text-amber-500',
  },
]

export const Route = createFileRoute('/admin/posts/upload/$id')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: PostEditor,
})

function PostEditor() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = id === 'new'

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagsInput, setTagsInput] = useState('')
  const [status, setStatus] = useState<PostStatus>('draft')
  const [publishedAt, setPublishedAt] = useState<string>('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [featured, setFeatured] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [allowComments, setAllowComments] = useState(true)

  const [showSettings, setShowSettings] = useState(false)

  // Fetch existing post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getAdminPostById({ id }),
    enabled: !isNew,
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Populate form when post loads
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setSlug(post.slug)
      setExcerpt(post.excerpt || '')
      setBody(post.body || '')
      setThumbnail(post.thumbnail)
      setCategoryId(post.category_id)
      setTags(post.tags || [])
      setStatus(post.status)
      setPublishedAt(post.published_at ? post.published_at.slice(0, 16) : '')
      setMetaTitle(post.meta_title || '')
      setMetaDescription(post.meta_description || '')
      setFeatured(post.featured)
      setPinned(post.pinned)
      setAllowComments(post.allow_comments)
    }
  }, [post])

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (isNew || !post?.slug) {
      setSlug(generateSlug(value))
    }
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        slug,
        excerpt: excerpt || null,
        body: body || null,
        thumbnail,
        category_id: categoryId,
        tags: tags.length > 0 ? tags : null,
        status,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        featured,
        pinned,
        allow_comments: allowComments,
      }

      if (isNew) {
        return createPost(
          data as Omit<PostInsert, 'user_id' | 'slug'> & { slug?: string },
        )
      } else {
        return updatePost({ id, ...data } as { id: string } & PostUpdate)
      }
    },
    onSuccess: (savedPost) => {
      toast.success(isNew ? 'Post created!' : 'Post saved!')
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      if (isNew) {
        navigate({ to: '/admin/posts/$id', params: { id: savedPost.id } })
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save post',
      )
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deletePost({ id }),
    onSuccess: () => {
      toast.success('Post deleted')
      navigate({ to: '/admin/posts' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete post',
      )
    },
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate()
    }
  }

  const handleAddTag = () => {
    const newTag = tagsInput.trim()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setTagsInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  if (!isNew && postLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/admin/posts' })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">
              {isNew ? 'New Post' : 'Edit Post'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/blog/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !title.trim() ||
                (status === 'scheduled' && !publishedAt)
              }
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1">
                Title
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-2xl font-bold h-auto py-3 border-0 border-b border-border rounded-none focus-visible:ring-0 px-0"
              />
              {!title.trim() && (
                <p className="text-xs text-destructive mt-1">
                  Title is required to create a post
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>/blog/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-7 w-64 text-sm"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Thumbnail
              </label>
              <ImageInput
                value={thumbnail}
                onChange={setThumbnail}
                aspectRatio="16/9"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-sm font-medium mb-2 block">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <RichTextEditor
                content={body}
                onChange={setBody}
                placeholder="Write your post content here..."
              />
            </div>

            {/* Settings Panel */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Post Settings</span>
                </div>
                <span
                  className={cn(
                    'transition-transform',
                    showSettings && 'rotate-180',
                  )}
                >
                  ▼
                </span>
              </button>

              {showSettings && (
                <div className="p-4 pt-0 space-y-4 border-t border-border">
                  {/* Status & Schedule */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Status
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={
                                  POST_STATUS_OPTIONS.find(
                                    (opt) => opt.value === status,
                                  )?.color
                                }
                              >
                                {
                                  POST_STATUS_OPTIONS.find(
                                    (opt) => opt.value === status,
                                  )?.icon
                                }
                              </span>
                              {
                                POST_STATUS_OPTIONS.find(
                                  (opt) => opt.value === status,
                                )?.label
                              }
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {POST_STATUS_OPTIONS.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => setStatus(option.value)}
                              className="flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <span className={option.color}>
                                  {option.icon}
                                </span>
                                {option.label}
                              </span>
                              {status === option.value && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-1">
                        Publish Date
                        {status === 'scheduled' && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <DateTimePicker
                        value={publishedAt}
                        onChange={setPublishedAt}
                        placeholder="Select date and time"
                      />
                      {status === 'scheduled' && !publishedAt && (
                        <p className="text-xs text-destructive mt-1">
                          Publish date is required for scheduled posts
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Category
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                            {categoryId
                              ? categories?.find((cat) => cat.id === categoryId)
                                  ?.name || 'Unknown'
                              : 'No category'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                          onClick={() => setCategoryId(null)}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground">
                            No category
                          </span>
                          {!categoryId && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                        {categories?.map((cat) => (
                          <DropdownMenuItem
                            key={cat.id}
                            onClick={() => setCategoryId(cat.id)}
                            className="flex items-center justify-between"
                          >
                            {cat.name}
                            {categoryId === cat.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-sm bg-muted rounded-full flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Add tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Pinned</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Allow Comments</span>
                    </label>
                  </div>

                  {/* SEO */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">SEO Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Meta Title
                        </label>
                        <Input
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder={title || 'Meta title...'}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Meta Description
                        </label>
                        <textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder={excerpt || 'Meta description...'}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
