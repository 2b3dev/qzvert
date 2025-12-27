import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BarChart3, Clock, Home } from 'lucide-react'
import { Button } from '../../ui/button'

interface TimeExpiredScreenProps {
  score: number
  onFinish: () => void
}

export function TimeExpiredScreen({ score, onFinish }: TimeExpiredScreenProps) {
  return (
    <motion.div
      key="time_expired"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative inline-block mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
          <Clock className="w-12 h-12 text-destructive" />
        </div>
      </motion.div>
      <h2 className="text-4xl font-black text-destructive mb-4">หมดเวลา!</h2>
      <p className="text-muted-foreground mb-2">เวลาในการทำข้อสอบหมดแล้ว</p>
      <p className="text-5xl font-bold text-primary mb-2">{score} pts</p>
      <p className="text-muted-foreground mb-8">คะแนนที่ได้จากคำตอบที่ส่งแล้ว</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" variant="secondary" onClick={onFinish}>
          <Home className="w-5 h-5" />
          กลับหน้าหลัก
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/activity/results">
            <BarChart3 className="w-5 h-5" />
            ดูผลลัพธ์
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
