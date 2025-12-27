import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  Heading,
  List,
  Plus,
  Text,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input, Textarea } from '../ui/input'
import { cn } from '../../lib/utils'
import type { GeneratedLesson } from '../../types/database'

interface LessonModulesEditorProps {
  lessonModules: GeneratedLesson['modules']
  setLessonModules: React.Dispatch<React.SetStateAction<GeneratedLesson['modules']>>
  expandedModule: number | null
  setExpandedModule: (index: number | null) => void
}

export function LessonModulesEditor({
  lessonModules,
  setLessonModules,
  expandedModule,
  setExpandedModule,
}: LessonModulesEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5" />
          Modules ({lessonModules.length})
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLessonModules((prev) => [
              ...prev,
              { title: '', content_blocks: [{ type: 'text', content: '' }] },
            ])
            setExpandedModule(lessonModules.length)
          }}
        >
          <Plus className="w-4 h-4" />
          Add Module
        </Button>
      </div>

      {lessonModules.map((module, moduleIndex) => (
        <motion.div
          key={moduleIndex}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card
            className={cn(
              'transition-all duration-200',
              expandedModule === moduleIndex ? 'ring-2 ring-primary' : '',
            )}
          >
            <CardHeader
              className="cursor-pointer"
              onClick={() =>
                setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)
              }
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (moduleIndex > 0) {
                        setLessonModules((prev) => {
                          const newModules = [...prev]
                          const temp = newModules[moduleIndex]
                          newModules[moduleIndex] = newModules[moduleIndex - 1]
                          newModules[moduleIndex - 1] = temp
                          return newModules
                        })
                        setExpandedModule(moduleIndex - 1)
                      }
                    }}
                    disabled={moduleIndex === 0}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (moduleIndex < lessonModules.length - 1) {
                        setLessonModules((prev) => {
                          const newModules = [...prev]
                          const temp = newModules[moduleIndex]
                          newModules[moduleIndex] = newModules[moduleIndex + 1]
                          newModules[moduleIndex + 1] = temp
                          return newModules
                        })
                        setExpandedModule(moduleIndex + 1)
                      }
                    }}
                    disabled={moduleIndex === lessonModules.length - 1}
                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
                  {moduleIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {module.title || 'New Module'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {module.content_blocks.length} content block{module.content_blocks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (lessonModules.length > 1) {
                        setLessonModules((prev) => prev.filter((_, i) => i !== moduleIndex))
                        if (expandedModule === moduleIndex) {
                          setExpandedModule(null)
                        }
                      }
                    }}
                    disabled={lessonModules.length <= 1}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-muted-foreground transition-transform',
                      expandedModule === moduleIndex ? 'rotate-180' : '',
                    )}
                  />
                </div>
              </div>
            </CardHeader>

            <AnimatePresence>
              {expandedModule === moduleIndex && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 space-y-4">
                    {/* Module Title */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Module Title
                      </label>
                      <Input
                        value={module.title}
                        onChange={(e) => {
                          setLessonModules((prev) =>
                            prev.map((m, i) =>
                              i === moduleIndex ? { ...m, title: e.target.value } : m,
                            ),
                          )
                        }}
                        placeholder="Enter module title..."
                      />
                    </div>

                    {/* Content Blocks */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Content Blocks
                      </label>
                      <div className="space-y-3">
                        {module.content_blocks.map((block, blockIndex) => (
                          <div
                            key={blockIndex}
                            className="p-3 rounded-lg border border-border bg-secondary/20 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLessonModules((prev) =>
                                      prev.map((m, mi) =>
                                        mi === moduleIndex
                                          ? {
                                              ...m,
                                              content_blocks: m.content_blocks.map((b, bi) =>
                                                bi === blockIndex ? { ...b, type: 'text', content: b.content } : b,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }}
                                  className={cn(
                                    'p-1.5 rounded text-xs',
                                    block.type === 'text'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                  )}
                                  title="Text"
                                >
                                  <Text className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLessonModules((prev) =>
                                      prev.map((m, mi) =>
                                        mi === moduleIndex
                                          ? {
                                              ...m,
                                              content_blocks: m.content_blocks.map((b, bi) =>
                                                bi === blockIndex
                                                  ? { ...b, type: 'heading', metadata: { ...b.metadata, level: 2 } }
                                                  : b,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }}
                                  className={cn(
                                    'p-1.5 rounded text-xs',
                                    block.type === 'heading'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                  )}
                                  title="Heading"
                                >
                                  <Heading className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLessonModules((prev) =>
                                      prev.map((m, mi) =>
                                        mi === moduleIndex
                                          ? {
                                              ...m,
                                              content_blocks: m.content_blocks.map((b, bi) =>
                                                bi === blockIndex
                                                  ? { ...b, type: 'list', metadata: { ...b.metadata, items: b.metadata?.items || [''] } }
                                                  : b,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }}
                                  className={cn(
                                    'p-1.5 rounded text-xs',
                                    block.type === 'list'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                  )}
                                  title="List"
                                >
                                  <List className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-xs text-muted-foreground capitalize flex-1">
                                {block.type}
                              </span>
                              <button
                                onClick={() => {
                                  if (module.content_blocks.length > 1) {
                                    setLessonModules((prev) =>
                                      prev.map((m, mi) =>
                                        mi === moduleIndex
                                          ? { ...m, content_blocks: m.content_blocks.filter((_, bi) => bi !== blockIndex) }
                                          : m,
                                      ),
                                    )
                                  }
                                }}
                                disabled={module.content_blocks.length <= 1}
                                className="p-1 hover:bg-destructive/10 rounded text-destructive disabled:opacity-30"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {block.type === 'list' ? (
                              <div className="space-y-1">
                                {(block.metadata?.items || ['']).map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">•</span>
                                    <Input
                                      value={item}
                                      onChange={(e) => {
                                        setLessonModules((prev) =>
                                          prev.map((m, mi) =>
                                            mi === moduleIndex
                                              ? {
                                                  ...m,
                                                  content_blocks: m.content_blocks.map((b, bi) =>
                                                    bi === blockIndex
                                                      ? {
                                                          ...b,
                                                          metadata: {
                                                            ...b.metadata,
                                                            items: (b.metadata?.items || []).map((it, ii) =>
                                                              ii === itemIndex ? e.target.value : it,
                                                            ),
                                                          },
                                                        }
                                                      : b,
                                                  ),
                                                }
                                              : m,
                                          ),
                                        )
                                      }}
                                      placeholder="List item..."
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <button
                                      onClick={() => {
                                        setLessonModules((prev) =>
                                          prev.map((m, mi) =>
                                            mi === moduleIndex
                                              ? {
                                                  ...m,
                                                  content_blocks: m.content_blocks.map((b, bi) =>
                                                    bi === blockIndex
                                                      ? {
                                                          ...b,
                                                          metadata: {
                                                            ...b.metadata,
                                                            items: (b.metadata?.items || []).filter((_, ii) => ii !== itemIndex),
                                                          },
                                                        }
                                                      : b,
                                                  ),
                                                }
                                              : m,
                                          ),
                                        )
                                      }}
                                      disabled={(block.metadata?.items || []).length <= 1}
                                      className="p-1 hover:bg-destructive/10 rounded text-destructive disabled:opacity-30"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setLessonModules((prev) =>
                                      prev.map((m, mi) =>
                                        mi === moduleIndex
                                          ? {
                                              ...m,
                                              content_blocks: m.content_blocks.map((b, bi) =>
                                                bi === blockIndex
                                                  ? {
                                                      ...b,
                                                      metadata: {
                                                        ...b.metadata,
                                                        items: [...(b.metadata?.items || []), ''],
                                                      },
                                                    }
                                                  : b,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }}
                                  className="w-full h-7 text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Item
                                </Button>
                              </div>
                            ) : (
                              <Textarea
                                value={block.content}
                                onChange={(e) => {
                                  setLessonModules((prev) =>
                                    prev.map((m, mi) =>
                                      mi === moduleIndex
                                        ? {
                                            ...m,
                                            content_blocks: m.content_blocks.map((b, bi) =>
                                              bi === blockIndex ? { ...b, content: e.target.value } : b,
                                            ),
                                          }
                                        : m,
                                    ),
                                  )
                                }}
                                placeholder={block.type === 'heading' ? 'Heading text...' : 'Content text...'}
                                className={cn('min-h-[60px]', block.type === 'heading' && 'font-semibold')}
                              />
                            )}
                          </div>
                        ))}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLessonModules((prev) =>
                              prev.map((m, mi) =>
                                mi === moduleIndex
                                  ? { ...m, content_blocks: [...m.content_blocks, { type: 'text', content: '' }] }
                                  : m,
                              ),
                            )
                          }}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4" />
                          Add Content Block
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
