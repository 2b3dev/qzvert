import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ChevronRight,
  FileText,
  Folder,
  Gamepad2,
  Loader2,
} from 'lucide-react'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { getCategoryTree } from '../../server/categories'
import type { Category } from '../../types/database'

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
  head: () => ({
    meta: [
      { title: 'Categories - QzVert' },
      { name: 'description', content: 'Browse all learning categories' },
    ],
  }),
})

type CategoryWithChildren = Category & { children: CategoryWithChildren[] }

function CategoryCard({ category, index }: { category: CategoryWithChildren; index: number }) {
  const hasChildren = category.children && category.children.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to="/categories/$slug"
        params={{ slug: category.slug }}
        className="group block"
      >
        <div className="relative bg-card border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Folder className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Posts
                </span>
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Activities
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>

          {/* Subcategories preview */}
          {hasChildren && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {category.children.slice(0, 4).map((child) => (
                  <span
                    key={child.id}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {child.name}
                  </span>
                ))}
                {category.children.length > 4 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    +{category.children.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: getCategoryTree,
  })

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="w-10 h-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold">Categories</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our learning categories to find posts and activities that match your interests
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(categories as CategoryWithChildren[]).map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No categories yet</h2>
              <p className="text-muted-foreground">
                Categories will appear here once they are created.
              </p>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
