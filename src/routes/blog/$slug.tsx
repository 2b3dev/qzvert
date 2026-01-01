import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Folder,
  Loader2,
  Share2,
  Tag,
  User,
} from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { CommentSection } from '../../components/blog/CommentSection'
import { PostCard } from '../../components/blog/PostCard'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { Button } from '../../components/ui/button'
import { getPostBySlug, getRecentPosts, incrementPostViewCount } from '../../server/posts'
import type { Post } from '../../types/database'

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostPage,
  loader: async ({ params }) => {
    const post = await getPostBySlug({ slug: params.slug })
    if (!post) {
      throw notFound()
    }
    return { post }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    return {
      meta: [
        { title: post?.meta_title || post?.title || 'Blog Post' },
        { name: 'description', content: post?.meta_description || post?.excerpt || '' },
        { property: 'og:title', content: post?.meta_title || post?.title || '' },
        { property: 'og:description', content: post?.meta_description || post?.excerpt || '' },
        { property: 'og:image', content: post?.thumbnail || '' },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
})

function BlogPostPage() {
  const { post } = Route.useLoaderData()

  // Increment view count on mount
  useEffect(() => {
    incrementPostViewCount({ postId: post.id })
  }, [post.id])

  // Fetch related posts
  const { data: recentPosts } = useQuery({
    queryKey: ['posts', 'recent'],
    queryFn: () => getRecentPosts({ limit: 3 }),
  })

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // Estimate reading time (rough: 200 words per minute)
  const readingTime = post.body
    ? Math.ceil(post.body.split(/\s+/).length / 200)
    : 1

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt || '',
        url: window.location.href,
      })
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <DefaultLayout>
      <article className="min-h-screen">
        {/* Hero / Header */}
        <header className="relative">
          {post.thumbnail && (
            <div className="absolute inset-0 h-[400px]">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
            </div>
          )}

          <div className="container mx-auto px-4 pt-8 relative">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link to="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <ChevronRight className="w-4 h-4" />
              {post.category && (
                <>
                  <Link
                    to="/blog/category/$slug"
                    params={{ slug: post.category.slug }}
                    className="hover:text-foreground transition-colors"
                  >
                    {post.category.name}
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              <span className="truncate max-w-[200px]">{post.title}</span>
            </nav>

            <div className={post.thumbnail ? 'pt-32' : 'pt-8'}>
              {/* Category badge */}
              {post.category && (
                <Link
                  to="/blog/category/$slug"
                  params={{ slug: post.category.slug }}
                  className="inline-block px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-full mb-4 hover:opacity-90 transition-opacity"
                >
                  {post.category.name}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-4xl">
                {post.title}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                {post.author && (
                  <div className="flex items-center gap-2">
                    {post.author.avatar_url ? (
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.display_name || 'Author'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span>{post.author.display_name || 'Anonymous'}</span>
                  </div>
                )}

                {formattedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formattedDate}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {readingTime} min read
                </span>

                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count} views
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 max-w-3xl">
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Body content */}
              {post.body && (
                <div
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-muted rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="flex items-center gap-4 mt-8 pt-8 border-t">
                <span className="text-sm text-muted-foreground">Share this post:</span>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Comments */}
              <CommentSection postId={post.id} allowComments={post.allow_comments} />
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Author card */}
              {post.author && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-semibold mb-4">About the Author</h3>
                  <div className="flex items-center gap-3">
                    {post.author.avatar_url ? (
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.display_name || 'Author'}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {post.author.display_name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related posts */}
              {recentPosts && recentPosts.length > 0 && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-semibold mb-4">Recent Posts</h3>
                  <div className="space-y-1">
                    {recentPosts
                      .filter((p) => p.id !== post.id)
                      .slice(0, 3)
                      .map((relatedPost) => (
                        <PostCard
                          key={relatedPost.id}
                          post={relatedPost}
                          variant="compact"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Back to blog */}
              <Link
                to="/blog"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </aside>
          </div>
        </div>
      </article>
    </DefaultLayout>
  )
}
