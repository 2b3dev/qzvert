import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileText, Globe, Type, Video } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../../../hooks/useTranslation'
import { Textarea } from '../../ui/input'

type ContentType = 'text' | 'pdf' | 'video_link'
type Language = 'th' | 'en'

interface ContentInputProps {
  content: string
  onContentChange: (content: string) => void
  contentType: ContentType
  onContentTypeChange: (type: ContentType) => void
  language: Language
  onLanguageChange: (lang: Language) => void
}

const contentTypes = [
  { type: 'text' as ContentType, icon: Type, available: true },
  { type: 'pdf' as ContentType, icon: FileText, available: false },
  { type: 'video_link' as ContentType, icon: Video, available: false },
]

const languages = [
  { code: 'th' as Language, flag: '🇹🇭' },
  { code: 'en' as Language, flag: '🇺🇸' },
]

export function ContentInput({
  content,
  onContentChange,
  contentType,
  onContentTypeChange,
  language,
  onLanguageChange,
}: ContentInputProps) {
  const { t } = useTranslation()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Content Type Selector */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          {t('create.inputSource.label')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {contentTypes.map(({ type, icon: Icon, available }) => (
            <motion.button
              key={type}
              type="button"
              whileHover={available ? { scale: 1.02 } : {}}
              whileTap={available ? { scale: 0.98 } : {}}
              onClick={() => available && onContentTypeChange(type)}
              disabled={!available}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                contentType === type
                  ? 'border-primary bg-primary/10'
                  : available
                    ? 'border-border hover:border-muted-foreground bg-secondary/50'
                    : 'border-border bg-secondary/30 opacity-50 cursor-not-allowed'
              }`}
            >
              <Icon
                className={`w-5 h-5 mx-auto mb-2 ${contentType === type ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <div
                className={`font-medium text-sm text-center ${contentType === type ? 'text-primary' : 'text-foreground'}`}
              >
                {t(`create.inputSource.${type === 'video_link' ? 'video' : type}`)}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-1">
                {available
                  ? t(
                      `create.inputSource.${type === 'video_link' ? 'video' : type}Desc`,
                    )
                  : t('common.comingSoon')}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('create.contentInput.label')}
        </label>
        <Textarea
          placeholder={t('create.contentInput.placeholder')}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[200px] text-base"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('create.contentInput.tip')}</span>
          <span>
            {content.length} {t('create.contentInput.characters')}
          </span>
        </div>
      </div>

      {/* Language Dropdown */}
      <div className="relative">
        <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('create.language.label')}
        </label>
        <button
          type="button"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {languages.find((l) => l.code === language)?.flag}
            </span>
            <span className="font-medium">{t(`create.language.${language}`)}</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
              isLanguageOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isLanguageOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden"
            >
              {languages.map(({ code, flag }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(code)
                    setIsLanguageOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    language === code ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className="text-xl">{flag}</span>
                  <span className="font-medium">{t(`create.language.${code}`)}</span>
                  {language === code && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
