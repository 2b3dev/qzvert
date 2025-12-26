import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Crown,
  Gamepad2,
  Globe,
  Heart,
  Lightbulb,
  Map,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Wand2,
  Zap,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { DefaultLayout } from '../components/layouts/DefaultLayout'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  const coreValues = [
    {
      icon: Crown,
      title: 'Context Over Content',
      titleThai: 'บริบทคือราชา',
      description:
        'เพราะความรู้ที่ปราศจากสถานการณ์จริงคือความรู้ที่ตายแล้ว เรามุ่งมั่นที่จะเปลี่ยนทุกบรรทัดของตัวหนังสือ และทุกนาทีของวิดีโอ ให้กลายเป็นสถานการณ์จำลองที่ผู้เรียนต้อง "ใช้" ความรู้จริงเพื่อพิชิตภารกิจ',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: Gamepad2,
      title: 'Frictionless Fun',
      titleThai: 'สนุกแบบไร้แรงเสียดทาน',
      description:
        'เราคือวิศวกรแห่งความสนุก AI ของเราถูกออกแบบมาเพื่อทำงานหนักหลังบ้าน เพื่อเปลี่ยนกระบวนการ Gamification ที่ซับซ้อนให้กลายเป็นประสบการณ์ที่ง่ายที่สุดสำหรับผู้สร้าง และสนุกที่สุดสำหรับผู้เรียน',
      color: 'from-primary to-cyan-500',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    {
      icon: Rocket,
      title: 'Empowering Human Potential',
      titleThai: 'ปลดล็อกศักยภาพที่ไร้ขีดจำกัด',
      description:
        'เรามีพันธกิจในการขจัด "ความน่าเบื่อ" ซึ่งเป็นอุปสรรคที่ใหญ่ที่สุดของการพัฒนาตนเอง เมื่อมนุษย์มีความสุขในการเรียนรู้ ศักยภาพที่ซ่อนอยู่จะถูกปลดล็อกออกมาอย่างไม่มีที่สิ้นสุด',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  ]

  const stats = [
    { value: '10K+', label: 'เควสที่ถูกสร้าง', icon: Map },
    { value: '50K+', label: 'ผู้เรียนทั่วโลก', icon: Users },
    { value: '95%', label: 'อัตราความพึงพอใจ', icon: Heart },
    { value: '3x', label: 'เพิ่มการจดจำ', icon: Brain },
  ]

  const team = [
    {
      role: 'Vision',
      description: 'เราเชื่อว่าการเรียนรู้ควรเป็นการผจญภัย',
      icon: Lightbulb,
    },
    {
      role: 'Technology',
      description: 'AI ที่เข้าใจบริบทและสร้างประสบการณ์ที่มีความหมาย',
      icon: Zap,
    },
    {
      role: 'Design',
      description: 'ทุกรายละเอียดถูกออกแบบมาเพื่อสร้างความสนุก',
      icon: Sparkles,
    },
  ]

  const milestones = [
    {
      year: '2024',
      title: 'จุดเริ่มต้น',
      description: 'ไอเดียเกิดขึ้นจากความเชื่อที่ว่าการเรียนรู้ไม่ควรน่าเบื่อ',
    },
    {
      year: '2024',
      title: 'AI Engine',
      description: 'พัฒนา AI Context Engine รุ่นแรกสำเร็จ',
    },
    {
      year: '2025',
      title: 'Beta Launch',
      description: 'เปิดให้ทดลองใช้และได้รับผลตอบรับที่ดีเยี่ยม',
    },
    {
      year: 'Future',
      title: 'Global Expansion',
      description: 'มุ่งหน้าสู่การเป็นแพลตฟอร์มการเรียนรู้ระดับโลก',
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
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              About QzVert
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-foreground">We Don't Just Teach.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                We Build Worlds.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ที่ Qzvert เราเชื่อว่า{' '}
              <span className="text-foreground font-semibold">"การเรียนรู้"</span> ไม่ควรเป็นภาระ
              แต่มันควรจะเป็น
              <span className="text-primary font-semibold">
                การผจญภัยที่น่าตื่นเต้นที่สุด
              </span>
              ในชีวิตมนุษย์
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative">
              <BookOpen className="w-12 h-12 text-primary mb-6" />
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                ในโลกที่ข้อมูลท่วมท้นจนเราสำลัก แต่ความเข้าใจกลับลดลง เราจึงสร้าง{' '}
                <span className="text-primary font-bold">AI Context Engine</span> เพื่อชุบชีวิตเนื้อหาที่หยุดนิ่งให้กลายเป็น
                <span className="text-primary font-bold">โลกที่โต้ตอบได้</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Our Core Values
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              3 เสาหลักของเรา
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              หลักการที่เราใช้ขับเคลื่อนทุกสิ่งที่เราสร้าง
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative p-8 rounded-3xl bg-card border ${value.borderColor} overflow-hidden`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 ${value.bgColor} rounded-full blur-3xl`} />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6`}
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Number Badge */}
                  <div className="absolute top-0 right-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-1">{value.title}</h3>
                  <p className={`text-sm font-medium mb-4 bg-gradient-to-r ${value.color} bg-clip-text text-transparent`}>
                    {value.titleThai}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ตัวเลขที่<span className="text-primary">พิสูจน์</span>ความสำเร็จ
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl bg-card border border-border text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Drives Us */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              สิ่งที่<span className="text-primary">ขับเคลื่อน</span>เรา
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ทุกวันเราตื่นขึ้นมาด้วยเป้าหมายเดียวกัน
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((item, index) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.role}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Journey */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              เส้นทางของ<span className="text-primary">เรา</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              จากไอเดียสู่การเปลี่ยนแปลงการเรียนรู้
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary md:-translate-x-2 z-10" />

                  {/* Content */}
                  <div className={`flex-1 ml-12 md:ml-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-pink-500/20 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Join the Adventure
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-6">
              <span className="text-foreground">พร้อมที่จะเป็นส่วนหนึ่ง</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                ของการปฏิวัติการเรียนรู้?
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              ไม่ว่าคุณจะเป็นผู้เรียนที่อยากสนุก หรือผู้สร้างที่อยากสร้างสรรค์
              <br />
              QzVert พร้อมพาคุณไปสู่โลกแห่งการเรียนรู้ที่ไม่เหมือนใคร
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                asChild
              >
                <Link to="/explore">
                  <Target className="w-5 h-5" />
                  สำรวจเควส
                </Link>
              </Button>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                asChild
              >
                <Link to="/" hash="create">
                  <Wand2 className="w-5 h-5" />
                  สร้างเควสของคุณ
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Quote */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Trophy className="w-12 h-12 text-primary mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
              "เราไม่ได้สร้างแค่แพลตฟอร์ม เราสร้างโลกใหม่ที่ทุกคนอยากเรียนรู้"
            </blockquote>
            <p className="text-muted-foreground mt-4">— Team QzVert</p>
          </motion.div>
        </div>
      </section>
      </div>
    </DefaultLayout>
  )
}
