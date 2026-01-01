import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ChevronRight,
  Folder,
  Loader2,
  Rss,
  Search,
  Tag,
} from 'lucide-react'
import { useState } from 'react'
import { PostCard } from '../../components/blog/PostCard'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { getCategoriesWithCount } from '../../server/categories'
import { getFeaturedPosts, getPublishedPosts } from '../../server/posts'

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch featured posts
  const { data: featuredPosts } = useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: () => getFeaturedPosts({ limit: 3 }),
  })

  // Fetch all posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'published', page],
    queryFn: () => getPublishedPosts({ page, limit: 9 }),
  })

  // Fetch categories with count
  const { data: categories } = useQuery({
    queryKey: ['categories', 'withCount'],
    queryFn: getCategoriesWithCount,
  })

  const hasFeatured = featuredPosts && featuredPosts.length > 0

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Discover insights, tutorials, and updates from our team.
              </p>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Featured Posts */}
              {hasFeatured && (
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <Rss className="w-5 h-5 text-primary" />
                    Featured
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* First featured - large */}
                    <div className="md:col-span-2">
                      <PostCard post={featuredPosts[0]} variant="featured" />
                    </div>
                    {/* Rest - smaller */}
                    {featuredPosts.slice(1).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Posts */}
              <section>
                <h2 className="text-2xl font-semibold mb-6">Latest Posts</h2>

                {postsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : postsData?.posts.length ? (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {postsData.posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {postsData.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                          Page {page} of {postsData.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(postsData.totalPages, p + 1))}
                          disabled={page === postsData.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet. Check back soon!</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Categories
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          to="/blog/category/$slug"
                          params={{ slug: category.slug }}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span className="text-sm">{category.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {category.post_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags cloud - placeholder for future */}
              {/*
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      to="/blog"
                      search={{ tag }}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
              */}
            </aside>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}
