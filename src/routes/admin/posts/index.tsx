import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  Edit,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../../components/layouts/AdminLayout'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Input } from '../../../components/ui/input'
import {
  PaginatedTable,
  TableCellBadge,
  TableCellMuted,
} from '../../../components/ui/paginated-table'
import { cn } from '../../../lib/utils'
import { checkAdminAccess } from '../../../server/admin-activities'
import {
  deletePost,
  getAdminPosts,
  getPostStats,
  updatePost,
} from '../../../server/posts'
import type { Post, PostStatus } from '../../../types/database'

export const Route = createFileRoute('/admin/posts/')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminPosts,
})

function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [stats, setStats] = useState<{
    total: number
    published: number
    draft: number
    scheduled: number
    totalViews: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pagination
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ])

  const columnIdToSortBy: Record<
    string,
    'created_at' | 'updated_at' | 'published_at' | 'title' | 'view_count'
  > = {
    title: 'title',
    created_at: 'created_at',
    published_at: 'published_at',
    view_count: 'view_count',
  }

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const sortColumn = sorting[0]
      const sortBy = sortColumn
        ? columnIdToSortBy[sortColumn.id] || 'created_at'
        : 'created_at'
      const sortOrder = sortColumn?.desc ? 'desc' : 'asc'

      const [postsResult, statsResult] = await Promise.all([
        getAdminPosts({
          data: {
            page: pageIndex + 1,
            limit: pageSize,
            status: statusFilter,
            search: searchQuery || undefined,
            sortBy,
            sortOrder,
          },
        }),
        getPostStats(),
      ])

      setPosts(postsResult.posts)
      setTotalPosts(postsResult.total)
      setStats(statsResult)
    } catch (error) {
      toast.error('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pageIndex, sorting, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageIndex(0)
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    setDeletingId(id)
    try {
      await deletePost({ data: { id } })
      toast.success('Post deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete post')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFeatured = async (post: Post) => {
    try {
      await updatePost({ data: { id: post.id, featured: !post.featured } })
      toast.success(
        post.featured ? 'Removed from featured' : 'Added to featured',
      )
      fetchData()
    } catch (error) {
      toast.error('Failed to update post')
    }
  }

  const handleTogglePinned = async (post: Post) => {
    try {
      await updatePost({ data: { id: post.id, pinned: !post.pinned } })
      toast.success(post.pinned ? 'Unpinned' : 'Pinned')
      fetchData()
    } catch (error) {
      toast.error('Failed to update post')
    }
  }

  const handleStatusChange = async (post: Post, status: PostStatus) => {
    try {
      await updatePost({ data: { id: post.id, status } })
      toast.success(`Status changed to ${status}`)
      fetchData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const statusBadgeVariant = (
    status: PostStatus,
  ): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'default'
      case 'scheduled':
        return 'warning'
      case 'archived':
        return 'danger'
      default:
        return 'default'
    }
  }

  const columns: ColumnDef<Post>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
          const post = row.original
          return (
            <div className="flex items-center gap-3 min-w-0">
              {post.thumbnail ? (
                <img
                  src={post.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {post.title}
                  {post.featured && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  )}
                  {post.pinned && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  /blog/{post.slug}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <TableCellBadge variant={statusBadgeVariant(row.original.status)}>
            {row.original.status}
          </TableCellBadge>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <TableCellMuted>{row.original.category?.name || '-'}</TableCellMuted>
        ),
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.author?.avatar_url && (
              <img
                src={row.original.author.avatar_url}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="text-sm">
              {row.original.author?.display_name || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'view_count',
        header: 'Views',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="w-3 h-3" />
            {row.original.view_count}
          </div>
        ),
      },
      {
        accessorKey: 'published_at',
        header: 'Published',
        cell: ({ row }) => (
          <TableCellMuted>
            {row.original.published_at
              ? new Date(row.original.published_at).toLocaleDateString()
              : '-'}
          </TableCellMuted>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const post = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={"/admin/posts/upload/$id" as any} params={{ id: post.id } as any}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleFeatured(post)}>
                  <Star
                    className={cn(
                      'w-4 h-4 mr-2',
                      post.featured && 'fill-current',
                    )}
                  />
                  {post.featured ? 'Remove Featured' : 'Set Featured'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTogglePinned(post)}>
                  {post.pinned ? 'Unpin' : 'Pin to Top'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                {(
                  [
                    'draft',
                    'published',
                    'scheduled',
                    'archived',
                  ] as PostStatus[]
                ).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(post, status)}
                    disabled={post.status === status}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [deletingId],
  )

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Posts</h1>
            <p className="text-muted-foreground">Manage blog posts</p>
          </div>
          <Link to={"/admin/posts/upload/$id" as any} params={{ id: 'new' } as any}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-semibold text-foreground mb-3">
              Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Total Posts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-500">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total}
                </p>
              </motion.div>

              {/* Published */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500">
                    <FileCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.published}
                </p>
              </motion.div>

              {/* Draft */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Draft</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.draft}
                </p>
              </motion.div>

              {/* Scheduled */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-500">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.scheduled}
                </p>
              </motion.div>

              {/* Total Views */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-pink-500">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalViews.toLocaleString()}
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === 'all' ? 'All Status' : statusFilter}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(
                ['draft', 'published', 'scheduled', 'archived'] as PostStatus[]
              ).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <PaginatedTable
          columns={columns}
          data={posts}
          pageCount={Math.ceil(totalPosts / pageSize)}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={(updater) => {
            const newState =
              typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater
            setPageIndex(newState.pageIndex)
          }}
          manualPagination
          sorting={sorting}
          onSortingChange={setSorting}
          manualSorting
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}
