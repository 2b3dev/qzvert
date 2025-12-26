import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Shield,
  Mail,
  Lock,
  Eye,
  Database,
  UserCheck,
  Trash2,
  FileText,
  Globe,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { DefaultLayout } from '../components/layouts/DefaultLayout'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'ข้อมูลที่เราเก็บรวบรวม',
      titleEn: 'Data We Collect',
      content: [
        {
          subtitle: 'ข้อมูลบัญชี',
          items: [
            'อีเมล - ใช้สำหรับการเข้าสู่ระบบและติดต่อสื่อสาร',
            'ชื่อที่แสดง (Display Name) - ใช้แสดงในระบบ',
            'รูปโปรไฟล์ (ถ้ามี) - จาก Google หรืออัปโหลดเอง',
          ],
        },
        {
          subtitle: 'ข้อมูลการใช้งาน',
          items: [
            'เควสและควิซที่สร้าง',
            'คะแนนและความคืบหน้าในการเรียน',
            'ประวัติการเล่นเกม',
          ],
        },
      ],
    },
    {
      icon: Eye,
      title: 'วัตถุประสงค์ในการใช้ข้อมูล',
      titleEn: 'How We Use Your Data',
      content: [
        {
          subtitle: 'เราใช้ข้อมูลของคุณเพื่อ',
          items: [
            'ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี',
            'แสดงข้อมูลส่วนตัวในโปรไฟล์ของคุณ',
            'ส่งการแจ้งเตือนที่สำคัญเกี่ยวกับบัญชี',
            'ปรับปรุงประสบการณ์การใช้งาน',
            'วิเคราะห์และปรับปรุงบริการ (ข้อมูลรวม ไม่ระบุตัวตน)',
          ],
        },
      ],
    },
    {
      icon: Lock,
      title: 'การปกป้องข้อมูล',
      titleEn: 'Data Protection',
      content: [
        {
          subtitle: 'มาตรการรักษาความปลอดภัย',
          items: [
            'เข้ารหัสข้อมูลระหว่างการส่ง (SSL/TLS)',
            'จัดเก็บรหัสผ่านแบบเข้ารหัส (Hash)',
            'Row Level Security (RLS) จำกัดการเข้าถึงข้อมูล',
            'คุณเห็นได้เฉพาะข้อมูลของตัวเองเท่านั้น',
            'ผู้ดูแลระบบเข้าถึงได้เฉพาะเมื่อจำเป็น',
          ],
        },
      ],
    },
    {
      icon: UserCheck,
      title: 'สิทธิ์ของคุณ',
      titleEn: 'Your Rights',
      content: [
        {
          subtitle: 'ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
          items: [
            'สิทธิ์ในการเข้าถึง - ดูข้อมูลที่เราเก็บเกี่ยวกับคุณ',
            'สิทธิ์ในการแก้ไข - แก้ไขข้อมูลให้ถูกต้อง',
            'สิทธิ์ในการลบ - ขอลบข้อมูลของคุณ',
            'สิทธิ์ในการเพิกถอนความยินยอม - ถอนความยินยอมได้ทุกเมื่อ',
            'สิทธิ์ในการคัดค้าน - คัดค้านการประมวลผลข้อมูล',
            'สิทธิ์ในการโอนย้าย - ขอรับข้อมูลในรูปแบบที่อ่านได้',
          ],
        },
      ],
    },
    {
      icon: Globe,
      title: 'การเปิดเผยข้อมูล',
      titleEn: 'Data Sharing',
      content: [
        {
          subtitle: 'เราไม่ขายข้อมูลของคุณ',
          items: [
            'ไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลแก่บุคคลที่สาม',
            'เปิดเผยเฉพาะเมื่อกฎหมายบังคับ',
            'ใช้บริการของ Supabase และ Google Gemini สำหรับโครงสร้างพื้นฐาน',
            'ผู้ให้บริการเหล่านี้ปฏิบัติตามมาตรฐานความปลอดภัยสากล',
          ],
        },
      ],
    },
    {
      icon: Trash2,
      title: 'การลบข้อมูล',
      titleEn: 'Data Deletion',
      content: [
        {
          subtitle: 'เมื่อคุณต้องการลบบัญชี',
          items: [
            'ติดต่อเราเพื่อขอลบบัญชีและข้อมูลทั้งหมด',
            'ข้อมูลจะถูกลบภายใน 30 วันหลังยืนยัน',
            'ข้อมูลบางส่วนอาจเก็บไว้ตามที่กฎหมายกำหนด',
          ],
        },
      ],
    },
  ]

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
        {/* Header */}
        <section className="relative py-16 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลัก
            </Link>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Privacy Policy
            </div>

            <h1 className="text-3xl md:text-5xl font-black mb-4">
              <span className="text-foreground">นโยบาย</span>
              <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                ความเป็นส่วนตัว
              </span>
            </h1>

            <p className="text-muted-foreground max-w-2xl mx-auto">
              QzVert ให้ความสำคัญกับความเป็นส่วนตัวของคุณ
              <br />
              เราปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>

            <p className="text-sm text-muted-foreground mt-4">
              อัปเดตล่าสุด: 24 ธันวาคม 2567
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 md:p-8 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {section.titleEn}
                  </p>
                </div>
              </div>

              <div className="space-y-6 pl-16">
                {section.content.map((block, blockIndex) => (
                  <div key={blockIndex}>
                    <h3 className="font-semibold text-foreground mb-3">
                      {block.subtitle}
                    </h3>
                    <ul className="space-y-2">
                      {block.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-2 text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-pink-500/10 border border-primary/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">ติดต่อเรา</h2>
                <p className="text-sm text-muted-foreground">Contact Us</p>
              </div>
            </div>

            <div className="pl-16 space-y-4">
              <p className="text-muted-foreground">
                หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว
                หรือต้องการใช้สิทธิ์ตาม PDPA สามารถติดต่อเราได้ที่:
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link to="/contact">
                    <Mail className="w-4 h-4" />
                    ติดต่อทีมงาน
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="mailto:privacy@qzvert.com">
                    <FileText className="w-4 h-4" />
                    privacy@qzvert.com
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Consent Reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-muted/50 border border-border text-center"
          >
            <p className="text-sm text-muted-foreground">
              การสมัครใช้งาน QzVert ถือว่าคุณยินยอมให้เราเก็บรวบรวมและใช้ข้อมูลตามนโยบายนี้
              <br />
              คุณสามารถเพิกถอนความยินยอมได้ทุกเมื่อโดยติดต่อเรา
            </p>
          </motion.div>
        </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
