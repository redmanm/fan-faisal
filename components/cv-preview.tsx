'use client'

import React, { useRef, useState, useCallback } from 'react'
import { X, Download, Printer, Sparkles, HeartHandshake, Utensils, Phone } from 'lucide-react'

type Props = {
  language: 'en' | 'ar'
  name: string
  job: string
  nationality: string
  age: string
  experience: string
  experienceCountry?: string
  religion: string
  maritalStatus: string
  children: string
  salary: string
  fee: string
  weight: string
  height: string
  skills: string[]
  portrait: string
  gender?: string
  availability?: string
  passportNumber?: string
  passport?: string
  onClose: () => void
}

const countryData: Record<string, { en: string; ar: string }> = {
  Bangladesh: { en: 'Bangladesh', ar: 'بنغلاديش' },
  'بنغلاديش': { en: 'Bangladesh', ar: 'بنغلاديش' },
  Burundi: { en: 'Burundi', ar: 'بوروندي' },
  'بوروندي': { en: 'Burundi', ar: 'بوروندي' },
  Egypt: { en: 'Egypt', ar: 'مصر' },
  'مصر': { en: 'Egypt', ar: 'مصر' },
  Ethiopia: { en: 'Ethiopia', ar: 'إثيوبيا' },
  'إثيوبيا': { en: 'Ethiopia', ar: 'إثيوبيا' },
  Ghana: { en: 'Ghana', ar: 'غانا' },
  'غانا': { en: 'Ghana', ar: 'غانا' },
  India: { en: 'India', ar: 'الهند' },
  'الهند': { en: 'India', ar: 'الهند' },
  Indonesia: { en: 'Indonesia', ar: 'إندونيسيا' },
  'إندونيسيا': { en: 'Indonesia', ar: 'إندونيسيا' },
  Kenya: { en: 'Kenya', ar: 'كينيا' },
  'كينيا': { en: 'Kenya', ar: 'كينيا' },
  Malaysia: { en: 'Malaysia', ar: 'ماليزيا' },
  'ماليزيا': { en: 'Malaysia', ar: 'ماليزيا' },
  'New Zealand': { en: 'New Zealand', ar: 'نيوزيلندا' },
  'نيوزيلندا': { en: 'New Zealand', ar: 'نيوزيلندا' },
  Pakistan: { en: 'Pakistan', ar: 'باكستان' },
  'باكستان': { en: 'Pakistan', ar: 'باكستان' },
  Rwanda: { en: 'Rwanda', ar: 'رواندا' },
  'رواندا': { en: 'Rwanda', ar: 'رواندا' },
  Sudan: { en: 'Sudan', ar: 'السودان' },
  'السودان': { en: 'Sudan', ar: 'السودان' },
  Tanzania: { en: 'Tanzania', ar: 'تنزانيا' },
  'تنزانيا': { en: 'Tanzania', ar: 'تنزانيا' },
  Thailand: { en: 'Thailand', ar: 'تايلاند' },
  'تايلاند': { en: 'Thailand', ar: 'تايلاند' },
  'The Philippines': { en: 'The Philippines', ar: 'الفلبين' },
  'الفلبين': { en: 'The Philippines', ar: 'الفلبين' },
  Uganda: { en: 'Uganda', ar: 'أوغندا' },
  'أوغندا': { en: 'Uganda', ar: 'أوغندا' },
  Uzbekistan: { en: 'Uzbekistan', ar: 'أوزبكستان' },
  'أوزبكستان': { en: 'Uzbekistan', ar: 'أوزبكستان' },
  Yemen: { en: 'Yemen', ar: 'اليمن' },
  'اليمن': { en: 'Yemen', ar: 'اليمن' }
}

// Custom Skill Icons matching the exact aesthetic of the uploaded reference
function getSkillIcon(skillName: string) {
  const s = skillName.toLowerCase()
  if (s.includes('cook') || s.includes('طبخ') || s.includes('طباخ')) {
    return (
      <svg
        className="cv-skill-svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="#008064"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line x1="6" y1="17" x2="18" y2="17" />
      </svg>
    )
  }
  if (s.includes('child') || s.includes('أطفال') || s.includes('baby') || s.includes('رعاية')) {
    return (
      <svg
        className="cv-skill-svg"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="#008064"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 12h.01M15 12h.01" />
        <path d="M10 16c.5.5 1.5 1 2 1s1.5-.5 2-1" />
        <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5" />
      </svg>
    )
  }
  if (s.includes('clean') || s.includes('تنظيف') || s.includes('ترتيب')) {
    return <Sparkles className="cv-skill-svg" style={{ width: 20, height: 20, color: '#008064' }} />
  }
  if (s.includes('elder') || s.includes('مسن') || s.includes('كبار')) {
    return <HeartHandshake className="cv-skill-svg" style={{ width: 20, height: 20, color: '#008064' }} />
  }
  return <Utensils className="cv-skill-svg" style={{ width: 20, height: 20, color: '#008064' }} />
}

function localizeSkillName(skill: string, isArabic: boolean): string {
  if (!isArabic) return skill
  const s = skill.toLowerCase()
  if (s.includes('cook') || s.includes('طبخ')) return 'الطبخ'
  if (s.includes('child') || s.includes('أطفال')) return 'رعاية الأطفال'
  if (s.includes('clean') || s.includes('تنظيف')) return 'التنظيف والترتيب'
  if (s.includes('elder') || s.includes('مسن')) return 'رعاية كبار السن'
  return skill
}

export function CVPreview({
  language,
  name,
  job,
  nationality,
  age,
  experience,
  experienceCountry,
  religion,
  maritalStatus,
  children,
  salary,
  fee,
  weight,
  height,
  skills = ['Cooking', 'Childcare'],
  portrait,
  gender,
  availability,
  passportNumber,
  passport,
  onClose
}: Props) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic])

  const countryInfo = countryData[nationality]
  const localizedNationality = countryInfo ? (isArabic ? countryInfo.ar : countryInfo.en) : nationality

  // Format localized field values
  const displayPassport = passportNumber || passport || 'EP5419821'

  const displayWeight = weight
    ? (weight.toLowerCase().includes('kg') || weight.includes('كجم') ? weight : `${weight} ${t('kg', 'كجم')}`)
    : `55 ${t('kg', 'كجم')}`

  const displayHeight = height
    ? (height.toLowerCase().includes('cm') || height.includes('سم') ? height : `${height} ${t('cm', 'سم')}`)
    : `160 ${t('cm', 'سم')}`

  const displayGender = gender
    ? (isArabic ? (gender === 'Female' ? 'أنثى' : 'ذكر') : gender)
    : (isArabic ? 'أنثى' : 'Female')

  const displayReligion = religion
    ? (isArabic ? (religion === 'Islam' ? 'مسلم' : religion === 'Christianity' ? 'مسيحي' : religion) : religion)
    : 'Islam'

  const displayMarital = maritalStatus
    ? (isArabic ? (maritalStatus === 'Single' ? 'أعزب' : maritalStatus === 'Married' ? 'متزوج' : maritalStatus) : maritalStatus)
    : 'Single'

  const displayAvailability = availability
    ? (isArabic ? (availability === 'Available' ? 'متاح' : 'محجوز') : availability)
    : (isArabic ? 'متاح' : 'Available')

  const displayExperience = experience && experience !== '0'
    ? (experienceCountry ? `${experience} ${t('Years', 'سنوات')} (${experienceCountry})` : `${experience} ${t('Years', 'سنوات')}`)
    : t('No Experience', 'بدون خبرة')

  const displayAge = age ? `${age} ${t('Years', 'سنوات')}` : ''

  const cvRef = useRef<HTMLElement>(null)
  const [downloading, setDownloading] = useState(false)

  // Standard A4 PDF Generation (210mm x 297mm)
  async function downloadPdf() {
    if (!cvRef.current || downloading) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f7f8f5',
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.98),
        'JPEG',
        0,
        0,
        210,
        297,
        undefined,
        'FAST'
      )

      const safeName = (name || 'worker')
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'worker'

      pdf.save(`${safeName}-cv.pdf`)
    } catch (err) {
      console.error('Failed to export PDF:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Fallback skills if empty
  const activeSkills = skills && skills.length > 0 ? skills : ['Cooking', 'Childcare']

  return (
    <div
      className="cv-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t('Published worker CV', 'السيرة الذاتية للعامل')}
    >
      {/* Top Action Toolbar */}
      <div className="cv-actions">
        <div className="cv-actions-badge">
          <span className="cv-badge-dot" />
          <span>{t('Standard A4 Printable Format (100% Scale)', 'تنسيق صفحة A4 قياسي للطباعة (مقياس 100%)')}</span>
        </div>
        <div className="cv-actions-buttons">
          <button
            type="button"
            className="cv-btn-secondary"
            onClick={handlePrint}
            title={t('Print Page', 'طباعة المستند')}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('Print', 'طباعة')}</span>
          </button>
          <button
            type="button"
            className="cv-btn-primary"
            onClick={downloadPdf}
            disabled={downloading}
            title={t('Download A4 PDF', 'تحميل بصيغة PDF')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {downloading
                ? t('Preparing A4 PDF…', 'جارٍ تجهيز A4 PDF…')
                : t('Download A4 PDF', 'تحميل A4 PDF')}
            </span>
          </button>
          <button
            type="button"
            className="cv-btn-close"
            onClick={onClose}
            aria-label={t('Close', 'إغلاق')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable A4 Page Container matching the exact uploaded design */}
      <article
        ref={cvRef}
        className={`worker-cv ${isArabic ? 'cv-rtl' : ''}`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="cv-inner-page">
          {/* Top Header: Logo on Left, Dual-Language Company Header on Right */}
          <header className="cv-custom-header">
            <div className="cv-logo-wrapper">
              <img
                src="/fan-alfaisal-logo.png"
                alt={t('Fan AlFaisal Recruitment Company logo', 'شعار شركة فن الفيصل للاستقدام')}
                className="cv-logo-img"
              />
            </div>
            <div className="cv-header-company-info">
              <div className="cv-company-arabic">شركة فن الفيصل للإستقدام</div>
              <div className="cv-company-english">Fan AlFaisal Recruitment Company</div>
              <div className="cv-header-rule-wrapper">
                <span className="cv-rule-bar" />
                <span className="cv-rule-dot" />
                <span className="cv-rule-bar" />
              </div>
            </div>
          </header>

          {/* Candidate Role & Name Header (Centered) */}
          <div className="cv-candidate-title-block">
            <h1 className="cv-job-title">
              {job || t('Domestic Worker', 'عاملة منزلية')}
            </h1>
            <div className="cv-candidate-name">
              {(name || 'YESHI DEGEFA YADETIE').toUpperCase()}
            </div>
          </div>

          {/* Main Body Columns: Left = Full-Height Portrait, Right = Details & Skills */}
          <div className="cv-columns-grid">
            {/* Left Column: Portrait */}
            <div className="cv-portrait-column">
              <div className="cv-portrait-box">
                {portrait ? (
                  <img
                    src={portrait}
                    alt={t(`${name} portrait`, `الصورة الشخصية لـ ${name}`)}
                    className="cv-portrait-img"
                  />
                ) : (
                  <div className="cv-portrait-placeholder">
                    <img
                      src="/placeholder-user.jpg"
                      alt="Placeholder"
                      className="cv-portrait-img"
                      onError={(e) => {
                        // Fallback text if placeholder image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="cv-placeholder-text">
                      {t('Biometric Photo', 'الصورة الشخصية')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Tables */}
            <div className="cv-tables-column">
              {/* Section 1: Personal & Professional Details Table */}
              <div className="cv-section-table-box">
                <div className="cv-section-navy-header">
                  {t('Personal & professional details', 'المعلومات الشخصية والمهنية')}
                </div>
                <table className="cv-data-table">
                  <tbody>
                    <tr>
                      <td className="cv-data-label">{t('Passport No', 'رقم الجواز')}</td>
                      <td className="cv-data-value cv-passport-number">{displayPassport}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Nationality', 'الجنسية')}</td>
                      <td className="cv-data-value">{localizedNationality}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Age', 'العمر')}</td>
                      <td className="cv-data-value">{displayAge || '24 Years'}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Gender', 'الجنس')}</td>
                      <td className="cv-data-value">{displayGender}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Religion', 'الديانة')}</td>
                      <td className="cv-data-value">{displayReligion}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Marital status', 'الحالة الاجتماعية')}</td>
                      <td className="cv-data-value">{displayMarital}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Children', 'عدد الأطفال')}</td>
                      <td className="cv-data-value">{children || '0'}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Weight:', 'الوزن:')}</td>
                      <td className="cv-data-value">{displayWeight}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Height:', 'الطول:')}</td>
                      <td className="cv-data-value">{displayHeight}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Experience', 'الخبرة')}</td>
                      <td className="cv-data-value">{displayExperience}</td>
                    </tr>
                    <tr>
                      <td className="cv-data-label">{t('Availability', 'حالة التوفر')}</td>
                      <td className="cv-data-value">{displayAvailability}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Skills & Expertise Box */}
              <div className="cv-section-table-box cv-skills-section-box">
                <div className="cv-section-navy-header">
                  {t('Skills & expertise', 'المهارات والخبرات')}
                </div>
                <div className="cv-skills-list-container">
                  {activeSkills.map((skill) => (
                    <div key={skill} className="cv-skill-row">
                      <span className="cv-skill-dot">●</span>
                      <span className="cv-skill-icon-wrap">
                        {getSkillIcon(skill)}
                      </span>
                      <span className="cv-skill-label">
                        {localizeSkillName(skill, isArabic)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Navy & Teal Footer */}
          <footer className="cv-exact-footer">
            <div className="cv-footer-company-text">
              {t('Fan AlFaisal Recruitment Company', 'شركة فن الفيصل للإستقدام')}
            </div>
            <div className="cv-footer-unified-row">
              <Phone className="cv-footer-phone-icon" />
              <span>{t('Unified Number 920006629', 'الرقم الموحد 920006629')}</span>
            </div>
          </footer>
        </div>
      </article>
    </div>
  )
}
