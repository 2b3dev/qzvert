import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  ChevronRight,
  Folder,
  Loader2,
  Rss,
} from 'lucide-react'
import { useState } from 'react'
import { PostCard } from '../../components/blog/PostCard'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { Button } from '../../components/ui/button'
import { getCategoriesWithCount, getCategoryBySlug } from '../../server/categories'
import { getPublishedPosts } from '../../server/posts'

export const Route = createFileRoute('/blog/category/$slug')({
  component: CategoryPage,
  loader: async ({ params }) => {
    const category = await getCategoryBySlug({ slug: params.slug })
    if (!category) {
      throw notFound()
    }
    return { category }
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category
    return {
      meta: [
        { title: `${category?.name || 'Category'} - Blog` },
        { name: 'description', content: category?.description || `Posts in ${category?.name}` },
      ],
    }
  },
})

function CategoryPage() {
  const { category } = Route.useLoaderData()
  const [page, setPage] = useState(1)

  // Fetch posts in this category
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'published', 'category', category.slug, page],
    queryFn: () => getPublishedPosts({ page, limit: 9, categorySlug: category.slug }),
  })

  // Fetch all categories for sidebar
  const { data: categories } = useQuery({
    queryKey: ['categories', 'withCount'],
    queryFn: getCategoriesWithCount,
  })

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background py-12">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>{category.name}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Folder className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
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
                  <p>No posts in this category yet.</p>
                  <Link
                    to="/blog"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Browse all posts
                  </Link>
                </div>
              )}
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
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to="/blog/category/$slug"
                          params={{ slug: cat.slug }}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                            cat.slug === category.slug
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <span className="text-sm">{cat.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              cat.slug === category.slug
                                ? 'bg-primary-foreground/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {cat.post_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}
