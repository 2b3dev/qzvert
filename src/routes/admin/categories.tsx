import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  ChevronRight,
  Edit,
  Folder,
  FolderPlus,
  Loader2,
  MoreVertical,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import { checkAdminAccess } from '../../server/admin-activities'
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '../../server/categories'
import type { Category } from '../../types/database'

export const Route = createFileRoute('/admin/categories')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminCategories,
})

interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string | null
}

function AdminCategories() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: null,
  })

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Category created')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CategoryFormData>) =>
      updateCategory({ id, ...data }),
    onSuccess: () => {
      toast.success('Category updated')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', parent_id: null })
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (category: Category) => {
    if (category.post_count && category.post_count > 0) {
      toast.error(`Cannot delete category with ${category.post_count} posts`)
      return
    }
    if (confirm(`Delete "${category.name}"?`)) {
      deleteMutation.mutate({ id: category.id })
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }))
  }

  // Build tree structure for display
  const buildTree = (cats: typeof categories) => {
    const map = new Map<string | null, NonNullable<typeof cats>[0][]>()
    if (!cats) return map

    for (const cat of cats) {
      const parentId = cat.parent_id
      if (!map.has(parentId)) {
        map.set(parentId, [])
      }
      map.get(parentId)!.push(cat)
    }

    return map
  }

  const categoryTree = buildTree(categories)

  const renderCategory = (
    category: (typeof categories)[0],
    level = 0
  ): React.ReactNode => {
    const children = categoryTree.get(category.id) || []

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center justify-between py-3 px-4 hover:bg-muted/50 transition-colors',
            level > 0 && 'border-l-2 border-muted ml-6'
          )}
          style={{ paddingLeft: level > 0 ? 16 + level * 8 : 16 }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Folder className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">{category.name}</div>
              <div className="text-xs text-muted-foreground">
                /{category.slug} • {category.post_count || 0} posts
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(category)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    parent_id: category.id,
                    name: '',
                    slug: '',
                    description: '',
                  }))
                  setEditingId(null)
                  setShowForm(true)
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(category)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {children.length > 0 && (
          <div>{children.map((child) => renderCategory(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const rootCategories = categoryTree.get(null) || []

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage blog categories</p>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : rootCategories.length > 0 ? (
                <div className="divide-y">
                  {rootCategories.map((cat) => renderCategory(cat))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No categories yet</p>
                  <Button
                    variant="link"
                    onClick={() => setShowForm(true)}
                    className="mt-2"
                  >
                    Create your first category
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    {editingId ? 'Edit Category' : 'New Category'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Category name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="category-slug"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent_id || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          parent_id: e.target.value || null,
                        }))
                      }
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      <option value="">None (Top Level)</option>
                      {categories
                        ?.filter((c) => c.id !== editingId)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.parent ? `${cat.parent.name} → ` : ''}
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        createMutation.isPending ||
                        updateMutation.isPending ||
                        !formData.name.trim()
                      }
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {editingId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
