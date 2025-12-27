import IconApp from '@/components/icon/icon-app'
import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Briefcase,
  FileText,
  Gamepad2,
  GraduationCap,
  Map,
  MessageSquare,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { QuestCreator } from '../components/QuestCreator'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const problems = [
    {
      icon: BookOpen,
      title: 'คลังคำศัพท์เดิมๆ',
      description: 'ให้แค่การท่องจำที่ไร้บริบท (Lack of Context)',
    },
    {
      icon: Video,
      title: 'วิดีโอออนไลน์',
      description: 'การรับข้อมูลทางเดียวที่ชวนให้วอกแวกได้ง่าย',
    },
    {
      icon: FileText,
      title: 'เอกสาร PDF / บทความ',
      description: 'การอ่านที่ขาดแรงกระตุ้นให้ลงมือทำจริง',
    },
  ]

  const solutions = [
    {
      icon: Map,
      title: 'Instant World-Mapping',
      description:
        'ไม่ว่าจะเป็นคลังข้อสอบเก่า, วิดีโอสอนทักษะ หรือเอกสารวิชาการ AI จะเปลี่ยนให้เป็น "แผนที่การเดินทาง" (Learning Map) ทันที',
    },
    {
      icon: MessageSquare,
      title: 'Multi-Scenario Roleplay',
      description:
        'ฝึกฝนทักษะผ่านสถานการณ์จำลองที่ปรับตามเนื้อหา เช่น เปลี่ยนบทเรียนการขายเป็นการเจรจาปิดดีลกับ AI NPC',
    },
    {
      icon: Trophy,
      title: 'Reward-Driven Learning',
      description:
        'เปลี่ยนทุกความเข้าใจให้เป็นแต้ม XP, ไอเทม และการอัปเลเวลตัวละคร เพื่อสร้างความจดจำที่ฝังลึก',
    },
  ]

  const transformTypes = [
    {
      icon: Play,
      title: 'Video-to-Quest',
      description:
        'เปลี่ยนวิดีโอคอร์สออนไลน์ให้เป็นภารกิจสู้บอส (Quiz) ตามช่วงเวลาสำคัญ',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: FileText,
      title: 'Document-to-Dungeon',
      description:
        'แปลงเอกสาร PDF หรือสรุปบทเรียนยาวๆ ให้เป็นด่านผจญภัยที่ต้องใช้ข้อมูลในการผ่านทาง',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Gamepad2,
      title: 'Flashcard-to-RPG',
      description:
        'เปลี่ยนชุดคำศัพท์และนิยามแห้งๆ ให้กลายเป็นสกิลการ์ดที่ใช้ดวลได้จริง',
      color: 'from-purple-500 to-pink-500',
    },
  ]

  const creatorBenefits = [
    {
      icon: TrendingUp,
      title: 'ลดอัตราการเลิกเรียน',
      description: 'Reduce Churn Rate ด้วยประสบการณ์ที่ทำให้ติดใจ',
    },
    {
      icon: Users,
      title: 'สร้าง Community',
      description: 'ระบบกิลด์และ Leaderboard สร้างกลุ่มผู้เรียนที่แข็งแกร่ง',
    },
    {
      icon: Star,
      title: 'อัปเกรดมูลค่าเนื้อหา',
      description: 'ทำให้เนื้อหาเดิมดูทันสมัยและเข้าถึงง่ายสำหรับคนยุค AI',
    },
  ]

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
        {/* Hero Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <IconApp
                    className="w-10 h-10"
                    color={'hsl(var(--foreground))'}
                  />
                </motion.div>
                <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                  AI-Powered Edutainment
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-foreground">Pause Studying.</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  Start Playing.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
                เปลี่ยนบทเรียนที่น่าเบื่อ ให้กลายเป็นกิจกรรมที่แสนสนุก ด้วยพลัง AI
              </p>
              <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto mb-8">
                ไม่ว่าคุณจะเป็น <span className="text-primary">ผู้เรียน</span>{' '}
                ที่อยากสนุกกับการเรียน หรือ{' '}
                <span className="text-pink-400">ครู/Creator</span>{' '}
                ที่อยากสร้างประสบการณ์ใหม่
              </p>

              {/* Dual CTA */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                  asChild
                >
                  <Link to="/explore">
                    <GraduationCap className="w-5 h-5" />
                    เริ่มเรียนเลย
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                  asChild
                >
                  <a href="#create">
                    <Wand2 className="w-5 h-5" />
                    สร้างเควสของคุณ
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                เริ่มต้นใช้งานฟรี ไม่มีค่าใช้จ่าย
              </p>
            </motion.div>
          </div>
        </section>

        {/* Dual Audience Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                QzVert สำหรับ<span className="text-primary">ทุกคน</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ไม่ว่าคุณจะอยู่ฝั่งไหน เราช่วยให้การเรียนรู้สนุกขึ้น
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For Learners */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-6">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-primary">
                    สำหรับผู้เรียน
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    เรียนไปเล่นไป สนุกจนลืมว่ากำลังเรียน
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        ยิ่งเล่น ยิ่งสนุก ยิ่งเก่ง
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        เห็นพัฒนาการตัวเองทุกวัน
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        สนุกกับเพื่อนๆ ได้ทุกที่ทุกเวลา
                      </span>
                    </li>
                  </ul>
                  <Button
                    className="bg-gradient-to-r from-primary to-cyan-500"
                    asChild
                  >
                    <Link to="/explore">
                      <GraduationCap className="w-4 h-4" />
                      สำรวจเควส
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* For Creators */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-pink-500/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-pink-400">
                    สำหรับครู / Creator / องค์กร
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    สร้างประสบการณ์การเรียนรู้ที่น่าจดจำให้นักเรียนหรือพนักงาน
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        AI สร้างเควสจากเนื้อหาในไม่กี่วินาที
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        วัดผลง่าย เห็นภาพรวมชัด
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        ยกระดับประสบการณ์ผู้เรียนด้วยเนื้อหาที่น่าจดจำ
                      </span>
                    </li>
                  </ul>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                    asChild
                  >
                    <a href="#create">
                      <Wand2 className="w-4 h-4" />
                      สร้างเควสฟรี
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                "ทำไมความรู้ดีๆ ถึงถูกลืม?"
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                ปัญหาไม่ได้อยู่ที่เนื้อหา แต่อยู่ที่{' '}
                <span className="text-primary font-semibold">
                  "วิธีการนำเสนอ"
                </span>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-destructive/20 relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4">
                    <XCircle className="w-6 h-6 text-destructive/50" />
                  </div>
                  <problem.icon className="w-10 h-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                The QzVert Engine
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                "The Universal Context Layer"
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                เราไม่ได้สร้างเนื้อหาใหม่ แต่เรา{' '}
                <span className="text-primary font-semibold">"ชุบชีวิต"</span>{' '}
                เนื้อหาที่คุณมีอยู่แล้ว
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-card to-primary/5 border border-primary/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <solution.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {solution.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Transform Types Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                "รองรับทุกแหล่งการเรียนรู้ที่คุณรัก"
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Connect Everything - ไม่ว่าจะมีอะไร ก็เอามาใส่ QzVert ได้หมด
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {transformTypes.map((type, index) => (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative p-8 rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-6`}
                  >
                    <type.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Creator Value Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-400 text-sm font-medium mb-4">
                <Target className="w-4 h-4" />
                For Creators
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                เพิ่มความประทับใจ (Retention) ให้ถึงขีดสุด
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                เปลี่ยนคอร์สของคุณให้เป็น Premium Experience ที่ไม่มีใครเหมือน
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {creatorBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-pink-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-">
                <div className="text-foreground pb-2">
                  พร้อมเปลี่ยนการเรียนรู้
                </div>
                <div className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent py-2">
                  ให้สนุกกว่าที่เคย?
                </div>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                ไม่ว่าคุณจะอยากเรียนหรืออยากสอน QzVert พร้อมช่วยคุณ
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-500"
                  asChild
                >
                  <Link to="/explore">
                    <GraduationCap className="w-5 h-5" />
                    เริ่มเรียนเลย
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500"
                  asChild
                >
                  <a href="#create">
                    <Wand2 className="w-5 h-5" />
                    สร้างเควสของคุณ
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quest Creator Section */}
        <section id="create" className="py-16 px-6">
          <QuestCreator />
        </section>
      </div>
    </DefaultLayout>
  )
}
