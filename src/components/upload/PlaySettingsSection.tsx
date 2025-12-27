import { motion } from 'framer-motion'
import { Calendar, Clock, Infinity, Repeat, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DateTimePicker } from '../ui/date-time-picker'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

const ageRangeOptions = [
  { value: '3-5', label: 'เด็กเล็ก (3-5)', desc: 'ยังอ่านไม่ออก เรียนรู้จากภาพและการเล่น' },
  { value: '6-9', label: 'ประถมต้น (6-9)', desc: 'อ่านออกแล้ว เข้าใจเหตุผลง่ายๆ' },
  { value: '10-12', label: 'ประถมปลาย (10-12)', desc: 'คิดเชิงตรรกะได้ เข้าใจแนวคิดนามธรรมเบื้องต้น' },
  { value: '13-17', label: 'วัยรุ่น (13-17)', desc: 'คิดเชิงนามธรรมได้ดี วิเคราะห์ซับซ้อนขึ้น' },
  { value: '18+', label: 'ผู้ใหญ่ (18+)', desc: 'ไม่จำกัดความซับซ้อน' },
]

interface PlaySettingsSectionProps {
  replayLimit: number | null
  setReplayLimit: (limit: number | null) => void
  timeLimitMinutes: number | null
  setTimeLimitMinutes: (limit: number | null) => void
  availableFrom: string
  setAvailableFrom: (date: string) => void
  availableUntil: string
  setAvailableUntil: (date: string) => void
  ageRange: string | null
  setAgeRange: (range: string | null) => void
}

export function PlaySettingsSection({
  replayLimit,
  setReplayLimit,
  timeLimitMinutes,
  setTimeLimitMinutes,
  availableFrom,
  setAvailableFrom,
  availableUntil,
  setAvailableUntil,
  ageRange,
  setAgeRange,
}: PlaySettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.19 }}
      className="mb-6"
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Play Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Replay Limit */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Repeat className="w-4 h-4 inline-block mr-1" />
              Replay Limit
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReplayLimit(null)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  replayLimit === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Infinity className="w-4 h-4" />
                Unlimited
              </button>
              <button
                type="button"
                onClick={() => setReplayLimit(1)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  replayLimit !== null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                Limited
              </button>
              {replayLimit !== null && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={replayLimit || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1) setReplayLimit(val)
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    times
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {replayLimit === null
                ? 'Players can play this activity as many times as they want.'
                : `Players can only play this activity ${replayLimit} time${replayLimit > 1 ? 's' : ''}.`}
            </p>
          </div>

          {/* Time Limit */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Clock className="w-4 h-4 inline-block mr-1" />
              Time Limit
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTimeLimitMinutes(null)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  timeLimitMinutes === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Infinity className="w-4 h-4" />
                Unlimited
              </button>
              <button
                type="button"
                onClick={() => setTimeLimitMinutes(30)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  timeLimitMinutes !== null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                Limited
              </button>
              {timeLimitMinutes !== null && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={timeLimitMinutes || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value, 10)
                      if (!isNaN(val) && val >= 1) setTimeLimitMinutes(val)
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    minutes
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {timeLimitMinutes === null
                ? 'Players can take as long as they need to complete this activity.'
                : `Players must complete this activity within ${timeLimitMinutes} minute${timeLimitMinutes > 1 ? 's' : ''}.`}
            </p>
          </div>

          {/* Availability Window */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Date Limit
            </label>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => {
                  setAvailableFrom('')
                  setAvailableUntil('')
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  !availableFrom && !availableUntil
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Infinity className="w-4 h-4" />
                Unlimited
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!availableFrom && !availableUntil) {
                    // Set default: now to 7 days from now
                    const now = new Date()
                    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    setAvailableFrom(now.toISOString())
                    setAvailableUntil(weekLater.toISOString())
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  availableFrom || availableUntil
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                Limited
              </button>
            </div>
            {(availableFrom || availableUntil) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Available From
                  </label>
                  <DateTimePicker
                    value={availableFrom}
                    onChange={setAvailableFrom}
                    placeholder="Select start date"
                    outputFormat="iso"
                    maxDate={availableUntil || undefined}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Available Until
                  </label>
                  <DateTimePicker
                    value={availableUntil}
                    onChange={setAvailableUntil}
                    placeholder="Select end date"
                    outputFormat="iso"
                    minDate={availableFrom || undefined}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {!availableFrom && !availableUntil
                ? 'This activity is always available.'
                : availableFrom && availableUntil
                  ? `Available from ${new Date(availableFrom).toLocaleString()} to ${new Date(availableUntil).toLocaleString()}`
                  : availableFrom
                    ? `Available starting ${new Date(availableFrom).toLocaleString()}`
                    : `Available until ${new Date(availableUntil).toLocaleString()}`}
            </p>
          </div>

          {/* Age Range */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Users className="w-4 h-4 inline-block mr-1" />
              Age Range
            </label>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setAgeRange(null)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  !ageRange
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                All Ages
              </button>
              {ageRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAgeRange(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    ageRange === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  title={option.desc}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {ageRange
                ? ageRangeOptions.find((a) => a.value === ageRange)?.desc || 'Target age range for this activity.'
                : 'This activity is suitable for all ages.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
