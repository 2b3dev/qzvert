import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Crown,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export const Route = createFileRoute('/pricing')({ component: PricingPage })

interface PlanFeature {
  name: string
  explorer: string | boolean
  hero: string | boolean
  legend: string | boolean
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

function PricingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const faqItems: FAQItem[] = [
    // General
    {
      category: 'General',
      question: 'Qzvert คืออะไร? ต่างจากแอปเรียนออนไลน์ทั่วไปอย่างไร?',
      answer:
        'Qzvert คือ "AI Edutainment Platform" ที่เปลี่ยนเนื้อหาการเรียนรู้แห้งๆ ให้กลายเป็นโลกจำลอง (Contextual Learning) เราไม่ได้ให้คุณแค่อ่านหรือดู แต่เราให้คุณ "สวมบทบาท" และใช้ความรู้จริงเพื่อพิชิตภารกิจ ทำให้การเรียนสนุกเหมือนการเล่นเกม RPG',
    },
    {
      category: 'General',
      question: 'ต้องมีทักษะการเขียนโปรแกรมหรือออกแบบเกมไหมถึงจะใช้งานได้?',
      answer:
        'ไม่จำเป็นเลยครับ! นั่นคือหัวใจของ Qzvert คุณมีหน้าที่เพียงแค่อัปโหลดเนื้อหา (วิดีโอ, PDF หรือลิงก์บทความ) AI GM ของเราจะทำหน้าที่ "วิศวกรเกม" เนรมิตแผนที่ ด่าน และควิซให้คุณโดยอัตโนมัติในไม่กี่วินาที',
    },
    // For Creators
    {
      category: 'For Creators',
      question: 'ฉันสามารถนำ Qzvert ไปใช้กับคอร์สที่ฉันขายอยู่แล้วได้ไหม?',
      answer:
        'ได้แน่นอนครับ! Qzvert ถูกออกแบบมาเพื่อเป็น "Add-on Layer" คุณสามารถส่งลิงก์ Quest ให้ผู้เรียนของคุณเข้าไปเล่นหลังจากดูบทเรียนจบ เพื่อเพิ่มอัตราความเข้าใจ (Retention) และทำให้ผู้เรียนประทับใจจนต้องบอกต่อ',
    },
    {
      category: 'For Creators',
      question: 'ข้อมูลเนื้อหาที่ฉันอัปโหลดจะปลอดภัยไหม?',
      answer:
        'เราให้ความสำคัญกับความเป็นส่วนตัวและความปลอดภัยของข้อมูลเป็นอันดับหนึ่ง เนื้อหาที่คุณอัปโหลดจะถูกใช้เพื่อสร้างเควสในบัญชีของคุณเท่านั้น และเรามีระบบเข้ารหัสข้อมูลมาตรฐานสากลเพื่อป้องกันการเข้าถึงจากบุคคลภายนอก',
    },
    // For Learners
    {
      category: 'For Learners',
      question: 'ถ้าฉันตอบคำถามผิดบ่อยๆ จะเกิดอะไรขึ้น?',
      answer:
        'ในโลกของ Qzvert การตอบผิดไม่ใช่ความล้มเหลว แต่คือการเรียนรู้! หากคุณตอบผิด พลังชีวิต (Energy) อาจลดลง หรือเนื้อเรื่องอาจเปลี่ยนไปในทางที่ท้าทายขึ้น แต่อย่าห่วง AI ของเราจะส่ง "Hint" หรือตัวช่วยลับๆ มาให้เพื่อช่วยให้คุณพัฒนาและกลับมาพิชิตบอสได้อีกครั้ง',
    },
    {
      category: 'For Learners',
      question: 'แต้ม XP และไอเทมที่ได้ มีไว้ทำอะไร?',
      answer:
        'แต้มเหล่านี้ใช้เพื่อแสดงความก้าวหน้า (Progression) ของคุณ คุณสามารถนำไปอัปเกรด Avatar, ปลดล็อกด่านลับ หรือแลกรับสิทธิพิเศษจาก Creator (เช่น ส่วนลดคอร์สถัดไป หรือเอกสารลับ) ซึ่งจะช่วยสร้างความภูมิใจในทุกย่างก้าวของการเรียนรู้',
    },
    // Technology & Pricing
    {
      category: 'Technology & Pricing',
      question: 'AI ที่ใช้ประมวลผลมีความแม่นยำแค่ไหน?',
      answer:
        'เราใช้ขุมพลังจาก Gemini 2.5 Flash ซึ่งเป็น AI รุ่นล่าสุดที่เน้นความรวดเร็วและความแม่นยำสูง อย่างไรก็ตาม ระบบจะมีเครื่องมือให้ Creator สามารถ "ตรวจสอบและปรับแต่ง" (Review & Edit) เนื้อหาที่ AI สร้างขึ้นก่อนเผยแพร่จริงได้เสมอ',
    },
    {
      category: 'Technology & Pricing',
      question: 'หากสมัครสมาชิกรายเดือน (Pro) แล้วสามารถยกเลิกได้เมื่อไหร่?',
      answer:
        'คุณมีอิสระเต็มที่ครับ! คุณสามารถยกเลิกการสมัครสมาชิกได้ทุกเมื่อผ่านหน้า Dashboard โดยจะไม่มีค่าธรรมเนียมแอบแฝง และเควสที่คุณสร้างไว้แล้วจะยังคงถูกเก็บรักษาไว้ในระบบ (ตามเงื่อนไขของแพ็กเกจ)',
    },
  ]

  const faqCategories = [...new Set(faqItems.map((item) => item.category))]

  const plans = [
    {
      name: 'Explorer',
      nameThai: 'นักสำรวจ',
      description: 'เหมาะสำหรับผู้เริ่มต้นทดลองพลัง AI',
      price: 'Free',
      priceSuffix: 'Forever',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'bg-emerald-500/10',
      popular: false,
    },
    {
      name: 'Hero',
      nameThai: 'ฮีโร่',
      description: 'Creator, ติวเตอร์ และนักพัฒนามืออาชีพ',
      price: '฿490',
      priceSuffix: '/ month',
      icon: Rocket,
      color: 'from-primary to-cyan-500',
      borderColor: 'border-primary/50',
      bgGlow: 'bg-primary/20',
      popular: true,
    },
    {
      name: 'Legend',
      nameThai: 'ตำนาน',
      description: 'โรงเรียน, มหาวิทยาลัย และองค์กร',
      price: 'Contact',
      priceSuffix: 'Sales',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      bgGlow: 'bg-purple-500/10',
      popular: false,
    },
  ]

  const features: PlanFeature[] = [
    {
      name: 'AI Quest Creation',
      explorer: '3 เควส / เดือน',
      hero: 'ไม่จำกัด (Unlimited)',
      legend: 'ไม่จำกัด + Custom AI',
    },
    {
      name: 'Content Source',
      explorer: 'เอกสาร 5 หน้า / วิดีโอ 5 นาที',
      hero: 'ไม่จำกัดความยาว',
      legend: 'ไม่จำกัดความยาว',
    },
    {
      name: 'AI Roleplay Agent',
      explorer: 'พื้นฐาน (Simple NPC)',
      hero: 'Advanced (Emotional AI)',
      legend: 'Fully Custom Scenarios',
    },
    {
      name: 'Analytics',
      explorer: false,
      hero: 'Dashboard วิเคราะห์ผู้เรียนรายบุคคล',
      legend: 'Deep Insights & API Export',
    },
    {
      name: 'Gamification',
      explorer: 'Level & XP พื้นฐาน',
      hero: 'สร้างไอเทมและของรางวัลเองได้',
      legend: 'White-label & Guild System',
    },
    {
      name: 'Support',
      explorer: 'Community Support',
      hero: 'Priority Email Support',
      legend: 'Dedicated Success Manager',
    },
  ]

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-emerald-500" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/40" />
      )
    }
    return <span className="text-sm">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Pricing Plans
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-foreground">Choose Your Path to</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                Mastery
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              ไม่ว่าคุณจะเป็นนักศึกษาที่ต้องการจำสอบ หรือ Creator ที่ต้องการสร้าง Academy ระดับโลก
            </p>
            <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
              เรามีเครื่องมือที่พร้อมจะพาคุณ<span className="text-primary font-semibold">อัปเลเวล</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                <Card
                  className={`relative h-full overflow-hidden ${plan.borderColor} ${
                    plan.popular ? 'border-2 shadow-xl shadow-primary/20' : ''
                  }`}
                >
                  {/* Background Glow */}
                  <div className={`absolute top-0 right-0 w-40 h-40 ${plan.bgGlow} rounded-full blur-3xl`} />

                  <CardHeader className="relative pb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                    >
                      <plan.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">({plan.nameThai})</span>
                    </div>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="relative">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.priceSuffix}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3">
                      {features.map((feature) => {
                        const value =
                          plan.name === 'Explorer'
                            ? feature.explorer
                            : plan.name === 'Hero'
                              ? feature.hero
                              : feature.legend
                        const hasFeature = value !== false

                        return (
                          <li
                            key={feature.name}
                            className={`flex items-start gap-3 ${
                              !hasFeature ? 'opacity-50' : ''
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                hasFeature
                                  ? `bg-gradient-to-br ${plan.color}`
                                  : 'bg-muted'
                              }`}
                            >
                              {hasFeature ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <X className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{feature.name}</p>
                              {typeof value === 'string' && (
                                <p className="text-xs text-muted-foreground mt-0.5">{value}</p>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter className="relative pt-4">
                    {plan.name === 'Legend' ? (
                      <Button
                        className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                        size="lg"
                      >
                        <Users className="w-4 h-4" />
                        Contact Sales
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? `bg-gradient-to-r ${plan.color} hover:opacity-90`
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                        asChild
                      >
                        <Link to="/" hash="create">
                          <Zap className="w-4 h-4" />
                          {plan.name === 'Explorer' ? 'เริ่มต้นฟรี' : 'เริ่มต้นใช้งาน'}
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              เปรียบเทียบ<span className="text-primary">ฟีเจอร์</span>ทั้งหมด
            </h2>
            <p className="text-muted-foreground">
              ดูรายละเอียดแต่ละแพ็กเกจเพื่อเลือกแผนที่เหมาะกับคุณ
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Features</th>
                  <th className="text-center py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <GraduationCap className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold">Explorer</span>
                      <span className="text-xs text-muted-foreground">Free</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 bg-primary/5 rounded-t-lg">
                    <div className="flex flex-col items-center gap-1">
                      <Rocket className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-primary">Hero</span>
                      <span className="text-xs text-primary/70">฿490/mo</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <Crown className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold">Legend</span>
                      <span className="text-xs text-muted-foreground">Custom</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={`border-b border-border/50 ${
                      index % 2 === 0 ? 'bg-muted/30' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-foreground">{feature.name}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      {renderFeatureValue(feature.explorer)}
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/5 text-foreground">
                      {renderFeatureValue(feature.hero)}
                    </td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      {renderFeatureValue(feature.legend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Early Bird Banner */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 p-8 md:p-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Early Bird Exclusive
              </div>

              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                สมัครวันนี้รับ Exclusive{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  "Early Bird" Badge
                </span>
              </h3>
              <p className="text-muted-foreground mb-6">
                Badge พิเศษสำหรับโปรไฟล์ของคุณ แสดงให้ทุกคนเห็นว่าคุณเป็นผู้บุกเบิกคนแรกๆ
              </p>

              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                asChild
              >
                <Link to="/" hash="create">
                  <Wand2 className="w-5 h-5" />
                  เริ่มต้นสร้างเควสแรกของคุณเลย
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              คำถามที่<span className="text-primary">พบบ่อย</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              หาคำตอบสำหรับคำถามยอดนิยมเกี่ยวกับ Qzvert
            </p>
          </motion.div>

          {/* FAQ by Category */}
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  {category === 'General' && <HelpCircle className="w-5 h-5" />}
                  {category === 'For Creators' && <Wand2 className="w-5 h-5" />}
                  {category === 'For Learners' && <GraduationCap className="w-5 h-5" />}
                  {category === 'Technology & Pricing' && <Zap className="w-5 h-5" />}
                  {category === 'General' && 'ข้อมูลทั่วไป'}
                  {category === 'For Creators' && 'สำหรับผู้สร้างคอร์สและครู'}
                  {category === 'For Learners' && 'สำหรับผู้เรียน'}
                  {category === 'Technology & Pricing' && 'เทคนิคและราคา'}
                </h3>

                <div className="space-y-3">
                  {faqItems
                    .filter((item) => item.category === category)
                    .map((item, index) => {
                      const globalIndex = faqItems.findIndex(
                        (faq) => faq.question === item.question
                      )
                      const isOpen = openFAQ === globalIndex

                      return (
                        <motion.div
                          key={item.question}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-xl border border-border bg-card overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFAQ(globalIndex)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium text-foreground pr-4">
                              {item.question}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0"
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </motion.div>
                          </button>

                          <motion.div
                            initial={false}
                            animate={{
                              height: isOpen ? 'auto' : 0,
                              opacity: isOpen ? 1 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                              {item.answer}
                            </div>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Still have questions? CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20 text-center"
          >
            <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">ยังสงสัย?</h3>
            <p className="text-muted-foreground mb-4">
              คุยกับทีมงานของเราได้เลย เรายินดีช่วยเหลือคุณทุกคำถาม
            </p>
            <Button
              className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
              size="lg"
              asChild
            >
              <Link to="/contact">
                <MessageCircle className="w-4 h-4" />
                คุยกับทีมงาน
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Closing Hook */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">💎</div>
            <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-8">
              "เพราะทุกนาทีของความรู้มีค่า...
              <br />
              อย่าปล่อยให้มันถูกลืมไปในกองกระดาษ
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                เริ่มต้นใช้ Qzvert วันนี้
              </span>
              <br />
              เพื่อเปลี่ยนความรู้ให้เป็นอำนาจที่สนุกที่สุดในมือคุณ"
            </blockquote>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                asChild
              >
                <Link to="/" hash="create">
                  <Sparkles className="w-5 h-5" />
                  เริ่มต้นฟรีวันนี้
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
