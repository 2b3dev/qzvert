import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, Sparkles, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth-store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import IconApp from '@/components/icon/icon-app'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/login')({
  component: LoginPage
})

function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน')
        return
      }
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        return
      }
      if (!acceptedPrivacy) {
        setError('กรุณายอมรับนโยบายความเป็นส่วนตัว')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const { error: authError } = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else if (authError.message.includes('already registered')) {
          setError('อีเมลนี้ถูกใช้งานแล้ว')
        } else {
          setError(authError.message)
        }
      } else {
        navigate({ to: '/' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error: authError } = await signInWithGoogle()
    if (authError) {
      setError(authError.message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                <IconApp className="w-10 h-10" color="white" />
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl">
                {isSignUp ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isSignUp
                  ? 'สมัครเพื่อเริ่มสร้าง Learning Quest ของคุณ'
                  : 'เข้าสู่ระบบเพื่อสร้าง Learning Quest ของคุณ'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              ดำเนินการต่อด้วย Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {isSignUp && (
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      acceptedPrivacy
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50 hover:border-primary"
                    )}
                  >
                    {acceptedPrivacy && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <label className="text-sm text-muted-foreground">
                    ฉันยอมรับ{' '}
                    <Link
                      to="/privacy"
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                    >
                      นโยบายความเป็นส่วนตัว
                    </Link>{' '}
                    และยินยอมให้เก็บรวบรวมข้อมูลตามที่ระบุ
                  </label>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                }}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
