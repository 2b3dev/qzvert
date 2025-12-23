import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Clock,
  Facebook,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Twitter,
  Wand2,
  Youtube,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export const Route = createFileRoute('/contact')({ component: ContactPage })

function ContactPage() {
  const socialLinks = [
    {
      name: 'YouTube',
      handle: '@Qzvert_Official',
      description: 'ดูตัวอย่างการเปลี่ยนคอร์สแห้งๆ ให้กลายเป็นเกม และ Tutorial การใช้งาน AI',
      icon: Youtube,
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:bg-red-500/10',
      textColor: 'text-red-500',
      url: 'https://youtube.com/@Qzvert_Official',
    },
    {
      name: 'Facebook',
      handle: 'Qzvert - AI Edutainment Platform',
      description: 'อัปเดตข่าวสาร กิจกรรมพิเศษ และแชร์ประสบการณ์จากผู้ใช้งานทั่วโลก',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:bg-blue-500/10',
      textColor: 'text-blue-600',
      url: 'https://facebook.com/Qzvert',
    },
    {
      name: 'TikTok',
      handle: '@Qzvert.Learning',
      description: 'คลิปสั้นไอเดียเด็ด เปลี่ยนเรื่องยากให้สนุกได้ใน 60 วินาที',
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
      color: 'from-gray-900 to-gray-800 dark:from-white dark:to-gray-200',
      hoverColor: 'hover:bg-gray-500/10',
      textColor: 'text-foreground',
      url: 'https://tiktok.com/@Qzvert.Learning',
    },
    {
      name: 'X (Twitter)',
      handle: '@Qzvert',
      description: 'คุยกับเราแบบ Real-time และติดตามเทรนด์ AI EdTech ล่าสุด',
      icon: Twitter,
      color: 'from-gray-800 to-gray-900 dark:from-white dark:to-gray-300',
      hoverColor: 'hover:bg-gray-500/10',
      textColor: 'text-foreground',
      url: 'https://x.com/Qzvert',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4" />
              Contact Us
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-foreground">Let's Build the Future of</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                Learning Together
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              มีคำถาม ข้อเสนอแนะ หรืออยากแชร์ไอเดียเควสสุดเจ๋งของคุณ?
              <br />
              ทีม <span className="text-primary font-semibold">Game Master</span> ของเราพร้อมรับฟังและช่วยเหลือคุณเสมอ
            </p>
          </motion.div>
        </div>
      </section>

      {/* Direct Support Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="relative overflow-hidden border-primary/30">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <CardContent className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shrink-0">
                    <Mail className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                      <Sparkles className="w-3 h-3" />
                      Direct Support
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">ติดต่อสอบถาม</h2>
                    <p className="text-muted-foreground mb-4">
                      สำหรับปัญหาด้านการใช้งาน การแจ้งบั๊ก หรือการสอบถามข้อมูลแพ็กเกจ Enterprise สามารถส่งอีเมลหาเราได้โดยตรง
                    </p>

                    <a
                      href="mailto:support@qzvert.com"
                      className="inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors group"
                    >
                      <Mail className="w-6 h-6" />
                      support@qzvert.com
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>

                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>เราจะตอบกลับภายใน 24 ชั่วโมง ในวันทำการ</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Social Community Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-pink-500/20 text-primary text-sm font-medium mb-4">
              <Globe className="w-4 h-4" />
              Join the Community
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ติดตามเรา<span className="text-primary">บนโซเชียล</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              มาร่วมเป็นส่วนหนึ่งของวิวัฒนาการการเรียนรู้ อัปเดตฟีเจอร์ใหม่ๆ รับไอเดียการสร้างเควส และพูดคุยกับเพื่อนร่วมอุดมการณ์
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`block p-6 rounded-2xl bg-card border border-border ${social.hoverColor} transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center shrink-0 text-white`}
                  >
                    <social.icon />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{social.name}</h3>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className={`text-sm font-medium ${social.textColor} mb-2`}>
                      {social.handle}
                    </p>
                    <p className="text-sm text-muted-foreground">{social.description}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5" />
              <CardContent className="relative p-8 md:p-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-4">Location</h2>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-4">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Cloud-Based Team</span>
                </div>

                <p className="text-lg text-foreground font-semibold mb-2">Qzvert Co., Ltd.</p>
                <p className="text-muted-foreground">
                  Globally Minded | Founded in Thailand
                </p>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                    Remote First
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm">
                    Global Team
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm">
                    Thai Startup
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Quick Links CTA */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold mb-6">ไม่อยากรอ?</h3>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="outline" size="lg" className="text-lg px-6 py-6" asChild>
                <Link to="/pricing" hash="faq">
                  <HelpCircle className="w-5 h-5" />
                  หาคำตอบใน FAQ
                </Link>
              </Button>
              <Button
                size="lg"
                className="text-lg px-6 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                asChild
              >
                <Link to="/" hash="create">
                  <Wand2 className="w-5 h-5" />
                  เริ่มสร้างเควสแรกของคุณเลย
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Message */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">🎮</div>
            <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
              "ทุกคำถามคือจุดเริ่มต้นของการผจญภัยใหม่
              <br />
              เราพร้อมอยู่เคียงข้างคุณในทุกด่าน"
            </blockquote>
            <p className="text-muted-foreground mt-4">— Team Qzvert</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
