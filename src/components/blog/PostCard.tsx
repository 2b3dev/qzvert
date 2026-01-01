import { Link } from '@tanstack/react-router'
import { Calendar, Eye, MessageSquare, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Post } from '../../types/database'

interface PostCardProps {
  post: Post
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function PostCard({
  post,
  variant = 'default',
  className,
}: PostCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  if (variant === 'compact') {
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={cn(
          'group flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors',
          className,
        )}
      >
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-20 h-20 object-cover rounded-md shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {formattedDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {formattedDate}
            </p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={cn(
          'group relative block overflow-hidden rounded-xl',
          className,
        )}
      >
        <div className="aspect-[16/9] relative">
          {post.thumbnail ? (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {post.category && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded mb-2">
              {post.category.name}
            </span>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-white/70">
            {post.author?.display_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {post.author.display_name}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </div>
        {post.pinned && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-yellow-950 rounded">
              Pinned
            </span>
          </div>
        )}
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        'group block overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300',
        className,
      )}
    >
      <div className="aspect-[16/9] relative overflow-hidden">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl opacity-20">📝</span>
          </div>
        )}
        {post.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium bg-background/90 backdrop-blur-sm rounded">
              {post.category.name}
            </span>
          </div>
        )}
        {post.pinned && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-yellow-950 rounded">
              Pinned
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {post.author && (
              <span className="flex items-center gap-1">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.display_name || 'Author'}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <User className="w-3 h-3" />
                )}
                {post.author.display_name || 'Anonymous'}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.view_count}
            </span>
            {post.comment_count !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.comment_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
