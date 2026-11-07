'use client'

import { FormEvent, useState, useEffect, useCallback } from 'react'
import {
  ArrowRight, ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck,
  BadgeCheck, Globe, Phone, Check, Sparkles, Building2, UserCheck, ShieldAlert
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { neonClient } from '@/lib/neon/client'

const brandLogo = '/fan-alfaisal-logo.png'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null)

  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ar')) {
      return 'ar'
    }
    return 'en'
  })

  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [language, isArabic])

  // Prefetch main dashboard route on load for instant redirect upon auth
  useEffect(() => {
    router.prefetch('/')
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await neonClient.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (signInError) {
        setError(
          signInError.message ||
          t('Invalid email or password. Please check your credentials.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.')
        )
        setLoading(false)
        return
      }

      // Instant client-side redirect using pre-warmed route or query redirect
      const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      const redirectUrl = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/'
      router.replace(redirectUrl)
    } catch {
      setError(t('An unexpected error occurred. Please try again.', 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'))
      setLoading(false)
    }
  }

  const demoAccounts = [
    {
      id: 'super_admin',
      roleEn: 'Super Admin',
      roleAr: 'المدير الأعلى',
      descEn: 'Full system authority & roles',
      descAr: 'تحكم كامل بالنظام والصلاحيات',
      email: 'superadmin@demo.local',
      password: 'DemoAdmin!2026',
      badge: '👑',
      accent: '#c98d28'
    },
    {
      id: 'admin',
      roleEn: 'Admin Operations',
      roleAr: 'مدير العمليات',
      descEn: 'Worker CVs & placement management',
      descAr: 'إدارة السير الذاتية والتعاقدات',
      email: 'admin@demo.local',
      password: 'DemoAdmin!2026',
      badge: '🛡️',
      accent: '#008064'
    },
    {
      id: 'sponsor',
      roleEn: 'Sponsor / Employer',
      roleAr: 'الكفيل / صاحب العمل',
      descEn: 'Candidate catalog & order direct',
      descAr: 'تصفح العمالة المتاحة والطلب الفوري',
      email: 'sponsor@demo.local',
      password: 'DemoSponsor!2026',
      badge: '💼',
      accent: '#1b6fc2'
    },
  ]

  const useDemoAccount = useCallback((account: (typeof demoAccounts)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setSelectedDemoRole(account.id)
    setError('')
  }, [])

  return (
    <main className={`login-page-container ${isArabic ? 'rtl-mode' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} lang={language}>
      {/* Left Brand Showcase Panel */}
      <section className="login-brand-hero">
        <div className="login-hero-mesh-overlay" />

        <div className="login-brand-content">
          {/* Logo Showcase Card */}
          <div className="login-logo-card">
            <img
              src={brandLogo}
              alt="Fan AlFaisal Recruitment Company"
              className="login-main-logo"
            />
          </div>

          <div className="login-hero-text">
            <span className="login-hero-pill">
              <BadgeCheck style={{ width: 14, height: 14 }} />
              {t('Official Musaned Recruitment Partner', 'شريك معتمد لدى منصة مساند الرسمية')}
            </span>

            <h1 className="login-hero-title">
              {t('Recruitment Built on Trust, Quality & Dignity.', 'استقدام موثوق يضع الإنسان أولاً بأعلى معايير الجودة.')}
            </h1>

            <p className="login-hero-description">
              {t(
                'Comprehensive operational workspace for recruitment administrators, partner agencies, and sponsors in Saudi Arabia.',
                'البوابة الرسمية المتكاملة لإدارة مسار استقدام العمالة المنزلية والمهنية وتسهيل التعاقدات المباشرة للكفلاء في المملكة.'
              )}
            </p>
          </div>

          {/* Value Highlights */}
          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="login-feature-icon teal">
                <ShieldCheck />
              </div>
              <div className="login-feature-text">
                <strong>{t('Musaned Regulated Standards', 'مطابقة نظامية مع منصة مساند')}</strong>
                <span>{t('Strict adherence to Saudi Ministry regulations & pricing', 'التزام كامل بضوابط وتسعيرات وزارة الموارد البشرية')}</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon blue">
                <Sparkles />
              </div>
              <div className="login-feature-text">
                <strong>{t('Verified Talent from 19 Countries', 'كوادر مفحوصة ومؤهلة من ١٩ دولة')}</strong>
                <span>{t('Strict medical, police, and skills screening before deployment', 'فحص طبي وجنائي ومهني دقيق قبل اعتماد السير الذاتية')}</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon gold">
                <LockKeyhole />
              </div>
              <div className="login-feature-text">
                <strong>{t('Enterprise Security & Privacy', 'حماية بيانات وعقود مشفرة')}</strong>
                <span>{t('Role-based secure access for sponsors and directors', 'صلاحيات وصول محكومة ومحمية لحسابات الكفلاء والمشرفين')}</span>
              </div>
            </div>
          </div>

          {/* Footer Callout */}
          <div className="login-hero-footer">
            <div className="login-support-phone">
              <Phone style={{ width: 15, height: 15 }} />
              <span>{t('Unified Support:', 'الرقم الموحد:')} <strong>920006629</strong></span>
            </div>
            <span>·</span>
            <span>{t('Riyadh, Kingdom of Saudi Arabia', 'الرياض، المملكة العربية السعودية')}</span>
          </div>
        </div>
      </section>

      {/* Right Authentication Form Panel */}
      <section className="login-form-area">
        <div className="login-form-box">
          {/* Top Bar inside Form Panel */}
          <div className="login-form-topbar">
            {/* Mobile Logo */}
            <div className="login-mobile-brand">
              <img src={brandLogo} alt="Fan AlFaisal" />
              <div>
                <strong>Fan Al Faisal</strong>
                <span>{isArabic ? 'شركة فن الفيصل للاستقدام' : 'Recruitment Co.'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Back to public candidate directory */}
              <a
                href="/"
                className="login-lang-toggle"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title={t('Browse candidates', 'تصفح العمالة المتاحة')}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} className={isArabic ? 'rotate-180' : ''} />
                <span>{t('Public Candidates', 'المرشحون')}</span>
              </a>

              {/* Language Switcher */}
              <button
                type="button"
                className="login-lang-toggle"
                onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
              >
                <Globe style={{ width: 14, height: 14 }} />
                <span>{isArabic ? 'English' : 'العربية'}</span>
              </button>
            </div>
          </div>

          {/* Form Header */}
          <div className="login-header-group">
            <span className="login-form-eyebrow">
              {t('FAN ALFAISAL / PORTAL ACCESS', 'بوابة فن الفيصل للاستقدام')}
            </span>
            <h2 className="login-form-heading">
              {t('Sign in to your account', 'تسجيل الدخول إلى حسابك')}
            </h2>
            <p className="login-form-subheading">
              {t('Enter your authorized credentials to proceed.', 'أدخل بيانات حسابك المعتمدة للمتابعة إلى النظام.')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-actual-form">
            {/* Email Field */}
            <div className="login-input-group">
              <label htmlFor="login-email">
                {t('Email Address', 'البريد الإلكتروني')}
              </label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('name@company.com', 'name@company.com')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <div className="login-password-label-row">
                <label htmlFor="login-password">
                  {t('Password', 'كلمة المرور')}
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    window.alert(t('Please contact the system administrator to reset your password.', 'يرجى التواصل مع مسؤول النظام لإعادة تعيين كلمة المرور.'))
                  }}
                  className="login-forgot-link"
                >
                  {t('Forgot password?', 'نسيت كلمة المرور؟')}
                </a>
              </div>
              <div className="login-input-wrap">
                <LockKeyhole className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Enter your password', 'أدخل كلمة المرور')}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('Hide password', 'إخفاء كلمة المرور') : t('Show password', 'إظهار كلمة المرور')}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="login-options-row">
              <label className="login-remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t('Remember me on this device', 'تذكرني على هذا الجهاز')}</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error-alert" role="alert">
                <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <span>{t('Authenticating…', 'جارٍ التحقق…')}</span>
              ) : (
                <>
                  <span>{t('Sign in to Workspace', 'تسجيل الدخول إلى البوابة')}</span>
                  {isArabic ? <ArrowLeft /> : <ArrowRight />}
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Hub */}
          <div className="login-demo-hub">
            <div className="login-demo-header">
              <div className="login-demo-title">
                <Sparkles style={{ width: 13, height: 13, color: 'var(--brand-teal)' }} />
                <strong>{t('Instant Demo Access', 'حسابات الدخول التجريبية')}</strong>
              </div>
              <small>{t('Select any role to auto-fill credentials', 'اختر أي حساب للملء التلقائي الفوري')}</small>
            </div>

            <div className="login-demo-grid">
              {demoAccounts.map((acc) => {
                const isSelected = selectedDemoRole === acc.id
                return (
                  <button
                    key={acc.id}
                    type="button"
                    className={`login-demo-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => useDemoAccount(acc)}
                  >
                    <div className="login-demo-card-left">
                      <span className="login-demo-badge-emoji">{acc.badge}</span>
                      <div className="login-demo-card-text">
                        <strong>{isArabic ? acc.roleAr : acc.roleEn}</strong>
                        <small>{acc.email}</small>
                      </div>
                    </div>

                    <span className="login-demo-select-indicator">
                      {isSelected ? <Check /> : (isArabic ? <ArrowLeft /> : <ArrowRight />)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legal / Authority Note */}
          <div className="login-legal-footer">
            <p>
              {t(
                'Authorized access only. By signing in, you agree to Musaned compliance policies & confidential recruitment terms.',
                'وصول مصرح به فقط. تسجيل الدخول يعني الالتزام بأنظمة منصة مساند وسياسات سرية بيانات الاستقدام.'
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
