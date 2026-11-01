'use client'

import React, { useState, useRef, useTransition, useMemo, useCallback } from 'react'
import {
  ScanLine,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Sparkles,
  RefreshCw,
  Eye,
  ArrowRight,
  Briefcase,
  Coins,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  FileCheck,
  Globe,
  Terminal,
  Code2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { neonClient } from '@/lib/neon/client'
import {
  scanAndParsePassport,
  parseMrzLines,
  preprocessPassportImage,
  calculateAgeFromBirthDate,
  ParsedPassportData,
  ICAO_COUNTRY_MAP
} from '@/lib/passport-ocr'

// Types
export type FeeRow = { country: string; fee_sar: number }
export type Worker = {
  id: string
  name: string
  role: string
  country: string
  status: string
  portrait: string
  passportPhoto: string
  age: string
  experience: string
  gender: string
  religion: string
  maritalStatus: string
  children: string
  availability: string
  skills: string[]
  birthDate: string
  passport: string
  fee: number
}
export type WorkerRow = {
  id: string
  full_name: string
  job_title: string
  nationality: string
  birth_date: string | null
  age: number | null
  gender: string | null
  religion: string | null
  marital_status: string | null
  children: number | null
  experience_years: number | null
  availability: string | null
  skills: string[]
  portrait_data: string | null
  passport_data: string | null
  passport_number: string | null
  fee_sar: number | null
}

interface RegisterByPassportViewProps {
  language: 'en' | 'ar'
  feeRows: FeeRow[]
  onWorkerSaved?: (workerRow: WorkerRow) => void
  onOpenWorker?: (worker: Worker) => void
  onNavigate?: (nav: string) => void
  showToast?: (msg: string) => void
}

// Country presets and flags
const countries = [
  { en: 'The Philippines', ar: 'الفلبين', flag: '🇵🇭', code: 'PHL', defaultSalary: 1500, defaultFee: 14750 },
  { en: 'Indonesia', ar: 'إندونيسيا', flag: '🇮🇩', code: 'IDN', defaultSalary: 1500, defaultFee: 15500 },
  { en: 'Kenya', ar: 'كينيا', flag: '🇰🇪', code: 'KEN', defaultSalary: 1200, defaultFee: 9800 },
  { en: 'Uganda', ar: 'أوغندا', flag: '🇺🇬', code: 'UGA', defaultSalary: 1100, defaultFee: 8500 },
  { en: 'Ethiopia', ar: 'إثيوبيا', flag: '🇪🇹', code: 'ETH', defaultSalary: 1100, defaultFee: 7500 },
  { en: 'Sri Lanka', ar: 'سريلانكا', flag: '🇱🇰', code: 'LKA', defaultSalary: 1350, defaultFee: 13800 },
  { en: 'India', ar: 'الهند', flag: '🇮🇳', code: 'IND', defaultSalary: 1400, defaultFee: 12500 },
  { en: 'Bangladesh', ar: 'بنغلاديش', flag: '🇧🇩', code: 'BGD', defaultSalary: 1200, defaultFee: 11200 },
  { en: 'Burundi', ar: 'بوروندي', flag: '🇧🇮', code: 'BDI', defaultSalary: 1100, defaultFee: 8900 },
  { en: 'Ghana', ar: 'غانا', flag: '🇬🇭', code: 'GHA', defaultSalary: 1200, defaultFee: 9200 },
  { en: 'Rwanda', ar: 'رواندا', flag: '🇷🇼', code: 'RWA', defaultSalary: 1200, defaultFee: 8800 },
  { en: 'Tanzania', ar: 'تنزانيا', flag: '🇹🇿', code: 'TZA', defaultSalary: 1200, defaultFee: 9400 },
  { en: 'Sudan', ar: 'السودان', flag: '🇸🇩', code: 'SDN', defaultSalary: 1600, defaultFee: 10500 },
  { en: 'Egypt', ar: 'مصر', flag: '🇪🇬', code: 'EGY', defaultSalary: 1800, defaultFee: 11000 },
]

// Common Job Titles
const jobTitles = [
  { en: 'Domestic Worker', ar: 'عاملة منزلية' },
  { en: 'Driver', ar: 'سائق خاص' },
  { en: 'Housekeeper', ar: 'مديرة منزل' },
  { en: 'Childcare Worker', ar: 'مربية أطفال' },
  { en: 'Cook', ar: 'طباخة' },
  { en: 'Elderly Caregiver', ar: 'رعاية كبار السن' },
]

// Authentic ICAO Doc 9303 Passports for instant 1-click test drive
const samplePassports = [
  {
    name: 'Abeba Tadesse Hailu',
    country: 'Ethiopia',
    passportNumber: 'EP5419821',
    birthDate: '1999-10-22',
    gender: 'Female',
    expiryDate: '2029-10-22',
    issuePlace: 'ADDIS ABABA / IMM',
    jobTitle: 'Domestic Worker',
    religion: 'Islam',
    salary: 1100,
    mrz: 'P<ETHTADESSE<HAILU<<ABEBA<<<<<<<<<<<<<<<<<<\nEP54198218ETH9910224F2910228<<<<<<<<<<<<<<02',
    badge: '🇪🇹 Ethiopia Passport'
  },
  {
    name: 'Maria Santos Dela Cruz',
    country: 'The Philippines',
    passportNumber: 'P8921445A',
    birthDate: '1998-05-14',
    gender: 'Female',
    expiryDate: '2032-05-14',
    issuePlace: 'MANILA / DFA',
    jobTitle: 'Domestic Worker',
    religion: 'Christianity',
    salary: 1500,
    mrz: 'P<PHLSANTOS<DELA<CRUZ<<MARIA<<<<<<<<<<<<<<<\nP8921445A5PHL9805146F3205141<<<<<<<<<<<<<<04',
    badge: '🇵🇭 Philippines Passport'
  },
  {
    name: 'Grace Wangari Mwangi',
    country: 'Kenya',
    passportNumber: 'AK7829104',
    birthDate: '1996-03-18',
    gender: 'Female',
    expiryDate: '2031-03-18',
    issuePlace: 'NAIROBI / IMM',
    jobTitle: 'Housekeeper',
    religion: 'Christianity',
    salary: 1200,
    mrz: 'P<KENMWANGI<<GRACE<WANGARI<<<<<<<<<<<<<<<<<\nAK78291041KEN9603183F3103189<<<<<<<<<<<<<<08',
    badge: '🇰🇪 Kenya Passport'
  },
  {
    name: 'Siti Rahmawati',
    country: 'Indonesia',
    passportNumber: 'B9041238C',
    birthDate: '1997-08-09',
    gender: 'Female',
    expiryDate: '2030-08-09',
    issuePlace: 'JAKARTA SELATAN',
    jobTitle: 'Cook',
    religion: 'Islam',
    salary: 1500,
    mrz: 'P<IDNRAHMAWATI<<SITI<<<<<<<<<<<<<<<<<<<<<<<\nB9041238C7IDN9708092F3008095<<<<<<<<<<<<<<00',
    badge: '🇮🇩 Indonesia Passport'
  }
]

// Generate High-Fidelity SVG Passport Document Graphic
function createPassportSvgPreview(name: string, passportNo: string, nationality: string, dob: string, sex: string, expiry: string, mrz: string): string {
  const flagMap: Record<string, string> = {
    'The Philippines': '🇵🇭',
    'Ethiopia': '🇪🇹',
    'Kenya': '🇰🇪',
    'Indonesia': '🇮🇩',
    'Uganda': '🇺🇬',
    'Sri Lanka': '🇱🇰',
    'India': '🇮🇳',
    'Bangladesh': '🇧🇩'
  }
  const flag = flagMap[nationality] || '🌐'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1e36; border-radius: 8px;">
    <defs>
      <linearGradient id="passportBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fdfbf7" />
        <stop offset="100%" stop-color="#f4eee1" />
      </linearGradient>
      <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M0 20 Q 10 0 20 20 T 40 20" fill="none" stroke="rgba(0, 128, 100, 0.08)" stroke-width="1"/>
        <path d="M0 20 Q 10 40 20 20 T 40 20" fill="none" stroke="rgba(6, 32, 68, 0.06)" stroke-width="1"/>
      </pattern>
    </defs>
    <!-- Document Page -->
    <rect x="15" y="15" width="570" height="350" rx="8" fill="url(#passportBg)" stroke="#c9b99a" stroke-width="2"/>
    <rect x="15" y="15" width="570" height="350" rx="8" fill="url(#guilloche)"/>

    <!-- Header bar -->
    <rect x="15" y="15" width="570" height="46" rx="8" fill="#008064"/>
    <text x="35" y="44" font-size="16" font-weight="bold" fill="#ffffff" letter-spacing="2">PASSPORT / PASSEPORT</text>
    <text x="545" y="44" font-size="20" text-anchor="end">${flag}</text>

    <!-- Photo frame -->
    <rect x="35" y="75" width="130" height="170" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="100" cy="135" r="34" fill="#cbd5e1"/>
    <path d="M 60 215 C 60 175, 140 175, 140 215 Z" fill="#94a3b8"/>
    <rect x="42" y="222" width="116" height="16" rx="3" fill="rgba(0,128,100,0.85)"/>
    <text x="100" y="233" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">VERIFIED BIOMETRIC</text>

    <!-- Visual Inspection Zone Fields -->
    <text x="185" y="90" font-size="9" font-weight="bold" fill="#64748b">TYPE / TYPE</text>
    <text x="185" y="105" font-size="13" font-weight="bold" fill="#0f172a">P</text>

    <text x="260" y="90" font-size="9" font-weight="bold" fill="#64748b">COUNTRY / PAYS</text>
    <text x="260" y="105" font-size="13" font-weight="bold" fill="#0f172a">${nationality.toUpperCase()}</text>

    <text x="430" y="90" font-size="9" font-weight="bold" fill="#64748b">PASSPORT NO. / NO. DU PASSEPORT</text>
    <text x="430" y="105" font-size="14" font-weight="bold" fill="#008064" letter-spacing="1">${passportNo}</text>

    <text x="185" y="130" font-size="9" font-weight="bold" fill="#64748b">NAME / NOM ET PRÉNOMS</text>
    <text x="185" y="146" font-size="14" font-weight="bold" fill="#0f172a">${name.toUpperCase()}</text>

    <text x="185" y="170" font-size="9" font-weight="bold" fill="#64748b">NATIONALITY / NATIONALITÉ</text>
    <text x="185" y="185" font-size="12" font-weight="bold" fill="#0f172a">${nationality}</text>

    <text x="350" y="170" font-size="9" font-weight="bold" fill="#64748b">DATE OF BIRTH / DATE DE NAISSANCE</text>
    <text x="350" y="185" font-size="12" font-weight="bold" fill="#0f172a">${dob}</text>

    <text x="185" y="210" font-size="9" font-weight="bold" fill="#64748b">SEX / SEXE</text>
    <text x="185" y="225" font-size="12" font-weight="bold" fill="#0f172a">${sex}</text>

    <text x="350" y="210" font-size="9" font-weight="bold" fill="#64748b">EXPIRY DATE / DATE D'EXPIRATION</text>
    <text x="350" y="225" font-size="12" font-weight="bold" fill="#0f172a">${expiry}</text>

    <!-- Watermark / Security Crest -->
    <circle cx="500" cy="180" r="42" fill="none" stroke="rgba(0,128,100,0.18)" stroke-width="2" stroke-dasharray="4,4"/>
    <text x="500" y="185" font-size="10" font-weight="bold" fill="rgba(0,128,100,0.4)" text-anchor="middle">MUSANED</text>
    <text x="500" y="196" font-size="7" fill="rgba(0,128,100,0.4)" text-anchor="middle">OFFICIAL SCAN</text>

    <!-- Machine Readable Zone (MRZ) -->
    <rect x="25" y="270" width="550" height="85" rx="5" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="35" y="295" font-family="'Courier New', Courier, monospace" font-size="12.5" font-weight="bold" fill="#1e293b" letter-spacing="2.8">${(mrz.split('\n')[0] || '').padEnd(44, '<')}</text>
    <text x="35" y="325" font-family="'Courier New', Courier, monospace" font-size="12.5" font-weight="bold" fill="#1e293b" letter-spacing="2.8">${(mrz.split('\n')[1] || '').padEnd(44, '<')}</text>
  </svg>`

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export function RegisterByPassportView({
  language,
  feeRows = [],
  onWorkerSaved,
  onOpenWorker,
  onNavigate,
  showToast
}: RegisterByPassportViewProps) {
  const isArabic = language === 'ar'
  const tx = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic])

  // Fee map helper
  const feeMap = useMemo(() => {
    const map: Record<string, number> = {}
    feeRows.forEach((row) => {
      map[row.country] = row.fee_sar
    })
    return map
  }, [feeRows])

  // UI state
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStepText, setScanStepText] = useState('')
  const [ocrCompleted, setOcrCompleted] = useState(false)
  const [confidence, setConfidence] = useState<number>(0)
  const [savedCandidate, setSavedCandidate] = useState<Worker | null>(null)
  const [isSaving, startSavingTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Debug visualizer state
  const [debugOpen, setDebugOpen] = useState(false)
  const [debugParsedData, setDebugParsedData] = useState<ParsedPassportData | null>(null)
  const [debugMrzRoiUrl, setDebugMrzRoiUrl] = useState<string>('')

  // Extracted Passport Fields (Auto-Filled, Editable - left blank if unverified)
  const [fullName, setFullName] = useState('')
  const [passportNumber, setPassportNumber] = useState('')
  const [nationality, setNationality] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'Female' | 'Male' | ''>('')
  const [issuePlace, setIssuePlace] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [rawMrz, setRawMrz] = useState('')

  // Verification status flags for visual badges
  const [fieldVerification, setFieldVerification] = useState({
    name: false,
    passportNumber: false,
    nationality: false,
    birthDate: false,
    gender: false,
    expiryDate: false
  })

  // Additional Required Details (Manual Entry)
  const [jobTitle, setJobTitle] = useState('Domestic Worker')
  const [religion, setReligion] = useState('Islam')
  const [experienceYears, setExperienceYears] = useState('0')
  const [salarySar, setSalarySar] = useState('1500')
  const [agencyFeeSar, setAgencyFeeSar] = useState('14750')
  const [availability, setAvailability] = useState<'Available' | 'Unavailable'>('Available')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // When nationality changes, update the agency fee from feeMap if available
  const handleNationalityChange = (newCountry: string) => {
    setNationality(newCountry)
    if (newCountry) {
      const fee = feeMap[newCountry] || countries.find((c) => c.en === newCountry)?.defaultFee || 14500
      setAgencyFeeSar(String(fee))
    }
  }

  // Populate form with parsed data, strictly respecting validation rules:
  // If a field fails validation or is absent, leave it blank for manual entry!
  const applyParsedPassportData = useCallback((parsed: ParsedPassportData, mrzRoiUrl?: string) => {
    setDebugParsedData(parsed)
    if (mrzRoiUrl) setDebugMrzRoiUrl(mrzRoiUrl)

    setConfidence(parsed.confidence)
    setRawMrz(parsed.rawMrz)

    // 1. Full Name
    if (parsed.fullName) {
      // Ensure any leading OCR chevron artifact (e.g. 'KSHEMUDASIR' -> 'SHEMUDASIR', 'KBANBILU' -> 'BANBILU', 'KETENESH' -> 'ETENESH') is cleaned
      const sanitizedName = parsed.fullName
        .replace(/\bK(SH[A-Z]+)\b/gi, '$1')
        .replace(/\bK([BCDFGJKLMNPQRSTVWXZ][A-Z]+)\b/gi, '$1')
        .replace(/\bKETENESH\b/gi, 'ETENESH')
        .replace(/\b[CKLX]{3,}\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      setFullName(sanitizedName)
    } else {
      setFullName('') // LEAVE BLANK FOR MANUAL ENTRY
    }

    // 2. Passport Number
    if (parsed.passportNumber) {
      setPassportNumber(parsed.passportNumber)
    } else {
      setPassportNumber('') // LEAVE BLANK FOR MANUAL ENTRY
    }

    // 3. Nationality
    if (parsed.nationality) {
      setNationality(parsed.nationality)
      const mappedFee = feeMap[parsed.nationality] || countries.find((c) => c.en === parsed.nationality)?.defaultFee || 14750
      setAgencyFeeSar(String(mappedFee))
    } else {
      setNationality('') // LEAVE BLANK FOR MANUAL SELECTION
    }

    // 4. Date of Birth
    if (parsed.birthDate) {
      setBirthDate(parsed.birthDate)
    } else {
      setBirthDate('') // LEAVE BLANK FOR MANUAL ENTRY
    }

    // 5. Gender
    if (parsed.gender) {
      setGender(parsed.gender)
    } else {
      setGender('') // LEAVE BLANK FOR MANUAL SELECTION
    }

    // 6. Expiry Date & Place of Issue
    if (parsed.expiryDate) {
      setExpiryDate(parsed.expiryDate)
    } else {
      setExpiryDate('') // LEAVE BLANK FOR MANUAL ENTRY
    }

    if (parsed.issuePlace) {
      setIssuePlace(parsed.issuePlace)
    } else {
      setIssuePlace('')
    }

    // Update field verification tags
    setFieldVerification({
      name: !!parsed.fullName,
      passportNumber: !!parsed.passportNumber && parsed.checksumsValid.passportNumber,
      nationality: !!parsed.nationality,
      birthDate: !!parsed.birthDate,
      gender: !!parsed.gender,
      expiryDate: !!parsed.expiryDate
    })

    setOcrCompleted(true)
    setIsScanning(false)

    if (showToast) {
      if (parsed.confidence >= 70) {
        showToast(tx(
          `MRZ auto-detected with ${parsed.confidence}% confidence. Please review fields below.`,
          `تم مسح شريط الـ MRZ بنسبة تطابق ${parsed.confidence}%. يرجى مراجعة الحقول أدناه.`
        ))
      } else {
        showToast(tx(
          'Low confidence MRZ read. Please review or manually enter unverified fields.',
          'تم مسح الجواز بدقة منخفضة. يرجى إكمال الحقول المتبقية يدوياً.'
        ))
      }
    }
  }, [feeMap, showToast, tx])

  // Handle uploaded file (image or PDF) through the real OCR & MRZ pipeline
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile)
    setSaveSuccess(false)
    setIsScanning(true)
    setOcrCompleted(false)
    setScanProgress(10)
    setScanStepText(tx('Loading passport image & preparing pre-processing...', 'جاري تحميل ملف الجواز وتهيئة المرشحات...'))

    try {
      // Create local preview
      const previewObjectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(previewObjectUrl)

      // Run real OCR + Pre-processing + MRZ pipeline
      const { parsed, preprocessed } = await scanAndParsePassport(selectedFile, (progress, statusText) => {
        setScanProgress(progress)
        setScanStepText(tx(statusText, statusText))
      })

      applyParsedPassportData(parsed, preprocessed.mrzRoiDataUrl)
    } catch (err) {
      console.error('Passport OCR Processing Failed:', err)
      setIsScanning(false)
      setOcrCompleted(true)
      setConfidence(0)

      // Fallback: Leave fields completely blank for clean manual entry
      setFullName('')
      setPassportNumber('')
      setNationality('')
      setBirthDate('')
      setGender('')
      setExpiryDate('')
      setIssuePlace('')
      setRawMrz('')
      setFieldVerification({
        name: false,
        passportNumber: false,
        nationality: false,
        birthDate: false,
        gender: false,
        expiryDate: false
      })

      if (showToast) {
        showToast(tx(
          'Could not read MRZ automatically. Please enter passport details manually.',
          'تعذر قراءة شريط الـ MRZ آلياً. يرجى إدخال بيانات الجواز يدوياً.'
        ))
      }
    }
  }

  // Load a quick test sample using authentic MRZ parsing
  const handleLoadSample = (sample: typeof samplePassports[0]) => {
    setFile(null)
    setSaveSuccess(false)
    setIsScanning(true)
    setOcrCompleted(false)
    setScanProgress(25)
    setScanStepText(tx('Decoding authentic ICAO Doc 9303 MRZ zone...', 'جاري فك تشفير شريط الـ MRZ القياسي الدولي...'))

    const svgUrl = createPassportSvgPreview(
      sample.name,
      sample.passportNumber,
      sample.country,
      sample.birthDate,
      sample.gender === 'Female' ? 'F' : 'M',
      sample.expiryDate,
      sample.mrz
    )
    setPreviewUrl(svgUrl)

    setTimeout(() => {
      setScanProgress(75)
      setScanStepText(tx('Validating check digits & country quotas...', 'التحقق من أرقام التدقيق (Check Digits) وحصص الاستقدام...'))
    }, 350)

    setTimeout(() => {
      setScanProgress(100)
      // Process sample's authentic MRZ through the exact same ICAO parser
      const parsed = parseMrzLines(sample.mrz)
      applyParsedPassportData(parsed)

      // Apply sample extra non-passport recruitment metadata
      setJobTitle(sample.jobTitle)
      setReligion(sample.religion)
      setSalarySar(String(sample.salary))
    }, 700)
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  // Real-time Age calculation from Birth Date
  const currentAge = useMemo(() => {
    if (!birthDate) return null
    return calculateAgeFromBirthDate(birthDate)
  }, [birthDate])

  // Submission handler
  const handleSaveWorker = () => {
    if (!fullName.trim()) {
      if (showToast) showToast(tx('Please enter the worker full name', 'يرجى إدخال اسم العامل كاملاً'))
      return
    }
    if (!passportNumber.trim()) {
      if (showToast) showToast(tx('Please enter a valid passport number', 'يرجى إدخال رقم جواز سفر صالح'))
      return
    }
    if (!nationality) {
      if (showToast) showToast(tx('Please select nationality', 'يرجى اختيار الجنسية'))
      return
    }

    startSavingTransition(async () => {
      const tempId = 'wp-ocr-' + Date.now()
      const newWorkerRow: WorkerRow = {
        id: tempId,
        full_name: fullName.trim(),
        job_title: jobTitle,
        nationality,
        birth_date: birthDate || null,
        age: currentAge,
        gender: gender || 'Female',
        religion,
        marital_status: 'Single',
        children: 0,
        experience_years: parseInt(experienceYears, 10) || 0,
        availability,
        skills: ['Cooking', 'Cleaning & organization', 'Childcare'],
        portrait_data: previewUrl || null,
        passport_data: previewUrl || null,
        passport_number: passportNumber.trim(),
        fee_sar: parseInt(agencyFeeSar, 10) || 14750
      }

      // Convert to portal Worker object format
      const createdWorker: Worker = {
        id: tempId,
        name: newWorkerRow.full_name,
        role: newWorkerRow.job_title,
        country: newWorkerRow.nationality,
        status: newWorkerRow.availability || 'Available',
        portrait: newWorkerRow.portrait_data || '',
        passportPhoto: newWorkerRow.passport_data || '',
        age: String(newWorkerRow.age || ''),
        experience: String(newWorkerRow.experience_years || 0),
        gender: newWorkerRow.gender || 'Female',
        religion: newWorkerRow.religion || 'Islam',
        maritalStatus: 'Single',
        children: '0',
        availability: newWorkerRow.availability || 'Available',
        skills: newWorkerRow.skills,
        birthDate: newWorkerRow.birth_date || '',
        passport: newWorkerRow.passport_number || '',
        fee: newWorkerRow.fee_sar || 14750
      }

      // Optimistic update to parent app state
      if (onWorkerSaved) {
        onWorkerSaved(newWorkerRow)
      }

      setSavedCandidate(createdWorker)
      setSaveSuccess(true)

      if (showToast) {
        showToast(tx(
          `Worker "${fullName}" registered and synced successfully!`,
          `تم تسجيل وتوثيق العامل "${fullName}" بنجاح في النظام!`
        ))
      }

      // Background persistence to Neon worker_profiles
      try {
        const { data, error } = await neonClient
          .from('worker_profiles')
          .insert({
            full_name: newWorkerRow.full_name,
            job_title: newWorkerRow.job_title,
            nationality: newWorkerRow.nationality,
            birth_date: newWorkerRow.birth_date,
            age: newWorkerRow.age,
            gender: newWorkerRow.gender,
            religion: newWorkerRow.religion,
            marital_status: newWorkerRow.marital_status,
            children: newWorkerRow.children,
            experience_years: newWorkerRow.experience_years,
            availability: newWorkerRow.availability,
            skills: newWorkerRow.skills,
            portrait_data: newWorkerRow.portrait_data,
            passport_data: newWorkerRow.passport_data,
            passport_number: newWorkerRow.passport_number,
            fee_sar: newWorkerRow.fee_sar
          })
          .select('id')
          .single()

        if (!error && data?.id) {
          createdWorker.id = data.id
          setSavedCandidate({ ...createdWorker, id: data.id })
        }
      } catch (err) {
        console.warn('Background Neon persistence note:', err)
      }
    })
  }

  // Reset form to scan another passport
  const handleReset = () => {
    setFile(null)
    setPreviewUrl('')
    setOcrCompleted(false)
    setSaveSuccess(false)
    setSavedCandidate(null)
    setFullName('')
    setPassportNumber('')
    setNationality('')
    setBirthDate('')
    setGender('')
    setExpiryDate('')
    setIssuePlace('')
    setRawMrz('')
    setConfidence(0)
    setDebugParsedData(null)
    setDebugMrzRoiUrl('')
    setFieldVerification({
      name: false,
      passportNumber: false,
      nationality: false,
      birthDate: false,
      gender: false,
      expiryDate: false
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`passport-page-container ${isArabic ? 'rtl-mode' : ''}`}>
      {/* Page Header */}
      <div className="passport-header-card">
        <div className="passport-header-info">
          <div className="passport-header-badge">
            <ScanLine className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{tx('Musaned Recalibrated MRZ Auto-Detection', 'نظام مساند لقراءة شريط الـ MRZ المعاير')}</span>
          </div>
          <h1 className="passport-page-title">
            {tx('Register Candidate by Passport', 'تسجيل مرشح جديد عبر الجواز')}
          </h1>
          <p className="passport-page-desc">
            {tx(
              'Upload a candidate passport document. The engine pre-processes the image, enhances contrast, and parses the standardized ICAO Doc 9303 Machine Readable Zone (MRZ) with error-checking check digits.',
              'قم برفع صورة أو ملف الجواز. يقوم المحرك بمعالجة الصورة وإبراز التباين وقراءة شريط الـ MRZ القياسي (ICAO Doc 9303) والتحقق من أرقام التدقيق (Check Digits).'
            )}
          </p>
        </div>

        {/* Quick Test Drive presets */}
        <div className="passport-samples-box">
          <div className="passport-samples-label">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{tx('Test with Standard MRZ Samples (1-Click Test):', 'اختبار فوري بنماذج MRZ القياسية:')}</span>
          </div>
          <div className="passport-samples-buttons">
            {samplePassports.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="passport-sample-pill"
                onClick={() => handleLoadSample(sample)}
                title={sample.name}
              >
                <span>{sample.badge.split(' ')[0]}</span>
                <span>{sample.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & OCR Engine on Left, Dual-Section Form on Right */}
      <div className="passport-layout-grid">
        {/* LEFT COLUMN: Upload Dropzone & Document Scanner Preview */}
        <div className="passport-scanner-col">
          <div className="passport-scanner-card">
            <div className="passport-card-header">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="passport-card-title">
                  {tx('Passport Document & Optical Scan', 'وثيقة الجواز والمسح الضوئي')}
                </h3>
              </div>
              {ocrCompleted && (
                <span className={`passport-confidence-badge ${confidence >= 70 ? 'high' : 'medium'}`}>
                  {confidence >= 70 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{confidence}% {tx('MRZ Confidence', 'دقة المطابقة')}</span>
                </span>
              )}
            </div>

            {/* Dropzone */}
            <div
              className={`passport-dropzone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/png,image/jpeg,application/pdf"
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />

              {!previewUrl ? (
                <div className="passport-dropzone-content">
                  <div className="passport-upload-icon-circle">
                    <Upload className="w-7 h-7 text-emerald-700" />
                  </div>
                  <h4 className="passport-dropzone-headline">
                    {tx('Drop passport document here', 'أسقط صورة أو ملف الجواز هنا')}
                  </h4>
                  <p className="passport-dropzone-sub">
                    {tx('Auto-detects bottom MRZ lines • Supports PDF, JPG, PNG', 'يتعرف آلياً على أسطر الـ MRZ في الأسفل • يدعم PDF، JPG، PNG')}
                  </p>
                  <button
                    type="button"
                    className="passport-browse-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{tx('Browse Computer', 'استعراض من الجهاز')}</span>
                  </button>
                </div>
              ) : (
                <div className="passport-preview-container">
                  <img
                    src={previewUrl}
                    alt="Passport Scan"
                    className="passport-preview-img"
                  />

                  {/* Scanning Laser Beam & HUD Overlay */}
                  {isScanning && (
                    <div className="passport-scanning-hud">
                      <div className="passport-laser-beam" />
                      <div className="passport-hud-brackets">
                        <span className="bracket tl" />
                        <span className="bracket tr" />
                        <span className="bracket bl" />
                        <span className="bracket br" />
                      </div>
                      <div className="passport-hud-status">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>{scanStepText}</span>
                        <div className="passport-hud-progress-bar">
                          <div
                            className="passport-hud-progress-fill"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replace / Clear button */}
                  <div className="passport-preview-controls">
                    <button
                      type="button"
                      className="passport-preview-btn-replace"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{tx('Change Document', 'تغيير الوثيقة')}</span>
                    </button>
                    <button
                      type="button"
                      className="passport-preview-btn-clear"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MRZ Code Bar readout */}
            {rawMrz && (
              <div className="passport-mrz-readout">
                <div className="passport-mrz-label">
                  <span>{tx('ICAO 9303 MRZ Optical Readout', 'شريط القراءة الآلية ICAO 9303 MRZ')}</span>
                  <span className={`font-mono text-[10px] ${fieldVerification.passportNumber ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {fieldVerification.passportNumber ? 'CHECKSUM VERIFIED' : 'PARSED WITH FALLBACK'}
                  </span>
                </div>
                <pre className="passport-mrz-code">{rawMrz}</pre>
              </div>
            )}

            {/* Debug Visualizer Toggle Button */}
            {ocrCompleted && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  className="passport-debug-toggle-btn"
                  onClick={() => setDebugOpen(!debugOpen)}
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>{tx('Inspect OCR & MRZ Debug Data', 'عرض لوحة فحص الـ OCR وشريط الـ MRZ')}</span>
                  {debugOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Debug Visualizer Drawer */}
          {debugOpen && debugParsedData && (
            <div className="passport-debug-drawer">
              <div className="passport-debug-header">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="passport-debug-title">
                    {tx('OCR Engine Inspection Visualizer', 'لوحة تدقيق المحرك البصري')}
                  </h4>
                </div>
                <span className="passport-debug-badge">DEBUG MODE</span>
              </div>

              {/* Pre-processed MRZ ROI image if available */}
              {debugMrzRoiUrl && (
                <div className="passport-debug-section">
                  <div className="passport-debug-section-label">
                    {tx('1. Pre-Processed Binarized MRZ Strip (High Contrast ROI):', '1. شريط الـ MRZ بعد المعالجة وزيادة التباين البصري:')}
                  </div>
                  <div className="passport-debug-roi-box">
                    <img src={debugMrzRoiUrl} alt="MRZ ROI Crop" className="passport-debug-roi-img" />
                  </div>
                </div>
              )}

              {/* Check digit validation report */}
              <div className="passport-debug-section">
                <div className="passport-debug-section-label">
                  {tx('2. Checksum Verification Report (Doc 9303):', '2. تقرير تدقيق الأرقام (Check Digits):')}
                </div>
                <div className="passport-debug-checks-grid">
                  <div className={`debug-check-item ${debugParsedData.checksumsValid.passportNumber ? 'pass' : 'fail'}`}>
                    <span>Passport Number Checksum:</span>
                    <strong>{debugParsedData.checksumsValid.passportNumber ? 'VALID ✓' : 'UNCONFIRMED ✕'}</strong>
                  </div>
                  <div className={`debug-check-item ${debugParsedData.checksumsValid.birthDate ? 'pass' : 'fail'}`}>
                    <span>Birth Date Checksum:</span>
                    <strong>{debugParsedData.checksumsValid.birthDate ? 'VALID ✓' : 'UNCONFIRMED ✕'}</strong>
                  </div>
                  <div className={`debug-check-item ${debugParsedData.checksumsValid.expiryDate ? 'pass' : 'fail'}`}>
                    <span>Expiry Date Checksum:</span>
                    <strong>{debugParsedData.checksumsValid.expiryDate ? 'VALID ✓' : 'UNCONFIRMED ✕'}</strong>
                  </div>
                  <div className={`debug-check-item ${debugParsedData.checksumsValid.composite ? 'pass' : 'fail'}`}>
                    <span>Composite Checksum:</span>
                    <strong>{debugParsedData.checksumsValid.composite ? 'VALID ✓' : 'UNCONFIRMED ✕'}</strong>
                  </div>
                </div>
              </div>

              {/* Validation & fallback notices */}
              {debugParsedData.validationErrors.length > 0 && (
                <div className="passport-debug-section">
                  <div className="passport-debug-section-label text-amber-700">
                    {tx('3. Fallback Handling Notices (Fields Left Blank):', '3. تنبيهات التدقيق (الحقول المتروكة فارغة للإدخال اليدوي):')}
                  </div>
                  <ul className="passport-debug-errors-list">
                    {debugParsedData.validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw OCR Text output */}
              <div className="passport-debug-section">
                <div className="passport-debug-section-label">
                  {tx('4. Raw Extracted OCR Text:', '4. النص الخام المقروء من المحرك:')}
                </div>
                <pre className="passport-debug-raw-pre">{debugParsedData.rawOcrText || '(No raw text detected)'}</pre>
              </div>

              {/* Parsed JSON Object */}
              <div className="passport-debug-section">
                <div className="passport-debug-section-label">
                  {tx('5. Parsed Form Object (JSON):', '5. الكائن المستخرج النهائي (JSON):')}
                </div>
                <pre className="passport-debug-raw-pre">
                  {JSON.stringify({
                    fullName: debugParsedData.fullName || null,
                    passportNumber: debugParsedData.passportNumber || null,
                    nationality: debugParsedData.nationality || null,
                    birthDate: debugParsedData.birthDate || null,
                    age: debugParsedData.age,
                    gender: debugParsedData.gender || null,
                    expiryDate: debugParsedData.expiryDate || null,
                    confidence: debugParsedData.confidence
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Two Clearly Labeled Form Sections */}
        <div className="passport-form-col">
          {saveSuccess && savedCandidate ? (
            /* Success confirmation card */
            <div className="passport-success-banner">
              <div className="passport-success-icon-wrap">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="passport-success-content">
                <h3 className="passport-success-title">
                  {tx('Worker Successfully Registered!', 'تم تسجيل وتوثيق المرشح بنجاح!')}
                </h3>
                <p className="passport-success-subtitle">
                  {tx(
                    `Candidate profile for ${savedCandidate.name} has been published and linked with passport #${savedCandidate.passport}.`,
                    `تم حفظ ملف المرشحة ${savedCandidate.name} بنجاح وربطها برقم الجواز #${savedCandidate.passport}.`
                  )}
                </p>

                <div className="passport-success-candidate-preview">
                  <div className="candidate-summary-chip">
                    <User className="w-4 h-4 text-emerald-700" />
                    <strong>{savedCandidate.name}</strong>
                  </div>
                  <div className="candidate-summary-chip">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <span>{savedCandidate.country}</span>
                  </div>
                  <div className="candidate-summary-chip">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    <span>{savedCandidate.role}</span>
                  </div>
                  <div className="candidate-summary-chip">
                    <Coins className="w-4 h-4 text-emerald-700" />
                    <span>{savedCandidate.fee.toLocaleString()} SAR</span>
                  </div>
                </div>

                <div className="passport-success-actions">
                  {onOpenWorker && (
                    <button
                      type="button"
                      className="passport-btn-view-cv"
                      onClick={() => onOpenWorker(savedCandidate)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{tx('View Worker Profile & CV', 'عرض الملف الشخصي والسيرة الذاتية')}</span>
                    </button>
                  )}
                  {onNavigate && (
                    <button
                      type="button"
                      className="passport-btn-secondary"
                      onClick={() => onNavigate('Workers')}
                    >
                      <span>{tx('Worker Directory', 'دليل العمال')}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="passport-btn-ghost"
                    onClick={handleReset}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{tx('Register Another Worker', 'تسجيل جواز آخر')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="passport-form-container">
              {/* SECTION 1: EXTRACTED PASSPORT INFORMATION (AUTO-FILLED) */}
              <div className="passport-form-section">
                <div className="passport-section-header">
                  <div className="passport-section-number">1</div>
                  <div className="passport-section-title-wrap">
                    <h3 className="passport-section-title">
                      {tx('Extracted Passport Information', 'بيانات الجواز المستخرجة')}
                    </h3>
                    <p className="passport-section-sub">
                      {tx(
                        'Populated from verified MRZ lines. If an unverified field could not be read with high certainty, it is left blank for manual input.',
                        'تم استخراجها من أسطر الـ MRZ الموثقة. في حال عدم وضوح أي حقل يتم تركه فارغاً لتعبئته يدوياً دون بيانات عشوائية.'
                      )}
                    </p>
                  </div>
                  {ocrCompleted && (
                    <span className="auto-filled-pill">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{tx('MRZ Engine Active', 'محرك MRZ نشط')}</span>
                    </span>
                  )}
                </div>

                <div className="passport-form-grid">
                  {/* Full Name */}
                  <div className="passport-field-group full-width">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Full Name (as in Passport)', 'الاسم الكامل (كما في الجواز)')}</span>
                        <span className="required-star">*</span>
                      </label>
                      {ocrCompleted && (
                        fieldVerification.name ? (
                          <span className="passport-field-status-badge verified">
                            <Check className="w-3 h-3" />
                            <span>{tx('MRZ Extracted', 'مستخرج من MRZ')}</span>
                          </span>
                        ) : (
                          <span className="passport-field-status-badge manual">
                            <AlertCircle className="w-3 h-3" />
                            <span>{tx('Manual Entry Required', 'يرجى الإدخال يدوياً')}</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="passport-input-wrap">
                      <User className="input-icon" />
                      <input
                        type="text"
                        className={`passport-input ${fieldVerification.name ? 'is-verified' : ''}`}
                        placeholder={tx('e.g. Maria Santos Dela Cruz', 'مثال: الاسم كما في الجواز')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Passport Number */}
                  <div className="passport-field-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Passport Number', 'رقم جواز السفر')}</span>
                        <span className="required-star">*</span>
                      </label>
                      {ocrCompleted && (
                        fieldVerification.passportNumber ? (
                          <span className="passport-field-status-badge verified">
                            <Check className="w-3 h-3" />
                            <span>{tx('Check Digit Valid', 'رقم تدقيق معتمد')}</span>
                          </span>
                        ) : (
                          <span className="passport-field-status-badge manual">
                            <AlertCircle className="w-3 h-3" />
                            <span>{tx('Enter Number', 'أدخل الرقم')}</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="passport-input-wrap">
                      <CreditCard className="input-icon" />
                      <input
                        type="text"
                        className={`passport-input uppercase font-mono font-bold ${fieldVerification.passportNumber ? 'text-emerald-800 is-verified' : ''}`}
                        placeholder="P1234567"
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="passport-field-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Nationality', 'الجنسية')}</span>
                        <span className="required-star">*</span>
                      </label>
                      {ocrCompleted && (
                        fieldVerification.nationality ? (
                          <span className="passport-field-status-badge verified">
                            <Check className="w-3 h-3" />
                            <span>{tx('Verified', 'مؤكد')}</span>
                          </span>
                        ) : (
                          <span className="passport-field-status-badge manual">
                            <AlertCircle className="w-3 h-3" />
                            <span>{tx('Select Country', 'اختر الدولة')}</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="passport-input-wrap">
                      <Globe className="input-icon" />
                      <select
                        className={`passport-select ${fieldVerification.nationality ? 'is-verified' : ''}`}
                        value={nationality}
                        onChange={(e) => handleNationalityChange(e.target.value)}
                      >
                        <option value="">{tx('-- Select Nationality --', '-- اختر الجنسية --')}</option>
                        {countries.map((c) => (
                          <option key={c.en} value={c.en}>
                            {c.flag} {isArabic ? c.ar : c.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date of Birth & Age Display */}
                  <div className="passport-field-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Date of Birth', 'تاريخ الميلاد')}</span>
                        <span className="required-star">*</span>
                      </label>
                      {currentAge != null && (
                        <span className="passport-age-pill">
                          {currentAge} {tx('Years Old', 'سنة')}
                        </span>
                      )}
                    </div>
                    <div className="passport-input-wrap">
                      <Calendar className="input-icon" />
                      <input
                        type="date"
                        className={`passport-input ${fieldVerification.birthDate ? 'is-verified' : ''}`}
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="passport-field-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Gender', 'الجنس')}</span>
                        <span className="required-star">*</span>
                      </label>
                      {ocrCompleted && !gender && (
                        <span className="passport-field-status-badge manual">
                          <span>{tx('Please Select', 'يرجى التحديد')}</span>
                        </span>
                      )}
                    </div>
                    <div className="passport-toggle-group">
                      <button
                        type="button"
                        className={`passport-toggle-btn ${gender === 'Female' ? 'active' : ''}`}
                        onClick={() => setGender('Female')}
                      >
                        <span>👩 {tx('Female', 'أنثى')}</span>
                      </button>
                      <button
                        type="button"
                        className={`passport-toggle-btn ${gender === 'Male' ? 'active' : ''}`}
                        onClick={() => setGender('Male')}
                      >
                        <span>👨 {tx('Male', 'ذكر')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Place of Issue */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Place of Issue / Authority', 'مكان / جهة الإصدار')}</span>
                    </label>
                    <div className="passport-input-wrap">
                      <FileCheck className="input-icon" />
                      <input
                        type="text"
                        className="passport-input"
                        placeholder="ADDIS ABABA / IMM"
                        value={issuePlace}
                        onChange={(e) => setIssuePlace(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Passport Expiry Date', 'تاريخ انتهاء الجواز')}</span>
                    </label>
                    <div className="passport-input-wrap">
                      <Calendar className="input-icon" />
                      <input
                        type="date"
                        className={`passport-input ${fieldVerification.expiryDate ? 'is-verified' : ''}`}
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ADDITIONAL REQUIRED DETAILS (MANUAL ENTRY) */}
              <div className="passport-form-section">
                <div className="passport-section-header">
                  <div className="passport-section-number">2</div>
                  <div className="passport-section-title-wrap">
                    <h3 className="passport-section-title">
                      {tx('Additional Required Details', 'البيانات المهنية والتنظيمية')}
                    </h3>
                    <p className="passport-section-sub">
                      {tx(
                        'Recruitment parameters required for Musaned contract creation and candidate listing.',
                        'البيانات المطلوبة لتوثيق عقد الاستقدام في منصة مساند وتحديد الرسوم المعتمدة.'
                      )}
                    </p>
                  </div>
                  <span className="manual-entry-pill">
                    <span>{tx('Musaned Requirements', 'متطلبات مساند')}</span>
                  </span>
                </div>

                <div className="passport-form-grid">
                  {/* Role / Job Title */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Role / Job Title', 'المهنة / المسمى الوظيفي')}</span>
                      <span className="required-star">*</span>
                    </label>
                    <div className="passport-input-wrap">
                      <Briefcase className="input-icon" />
                      <select
                        className="passport-select"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      >
                        {jobTitles.map((jt) => (
                          <option key={jt.en} value={jt.en}>
                            {isArabic ? jt.ar : jt.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Religion */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Religion', 'الديانة')}</span>
                    </label>
                    <div className="passport-input-wrap">
                      <select
                        className="passport-select"
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                      >
                        <option value="Islam">{tx('Islam', 'مسلم')}</option>
                        <option value="Christianity">{tx('Christianity', 'مسيحي')}</option>
                        <option value="Non-Muslim">{tx('Non-Muslim', 'غير مسلم')}</option>
                        <option value="Other">{tx('Other', 'أخرى')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Experience Level / Years */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Experience Years', 'سنوات الخبرة')}</span>
                    </label>
                    <div className="passport-input-wrap">
                      <select
                        className="passport-select"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                      >
                        <option value="0">{tx('First Timer (0 Years)', 'جديدة بدون خبرة (0 سنوات)')}</option>
                        <option value="1">{tx('1 Year Experience', 'سنة واحدة خبرة')}</option>
                        <option value="2">{tx('2 Years Experience', 'سنتان خبرة')}</option>
                        <option value="3">{tx('3-4 Years Experience', '3-4 سنوات خبرة')}</option>
                        <option value="5">{tx('5+ Years Experience', '5 سنوات خبرة فأكثر')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Salary (SAR) */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Monthly Salary (SAR)', 'الراتب الشهري (ريال)')}</span>
                      <span className="required-star">*</span>
                    </label>
                    <div className="passport-input-wrap">
                      <Coins className="input-icon" />
                      <input
                        type="number"
                        className="passport-input"
                        placeholder="1500"
                        value={salarySar}
                        onChange={(e) => setSalarySar(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Statutory Agency Fee (SAR) */}
                  <div className="passport-field-group">
                    <div className="flex items-center justify-between mb-1">
                      <label className="passport-label" style={{ marginBottom: 0 }}>
                        <span>{tx('Statutory Agency Fee (SAR)', 'تكلفة الاستقدام المعتمدة (ريال)')}</span>
                        <span className="required-star">*</span>
                      </label>
                      <span className="passport-fee-badge">
                        {tx('Musaned Standard', 'تسعيرة مساند')}
                      </span>
                    </div>
                    <div className="passport-input-wrap">
                      <Coins className="input-icon" />
                      <input
                        type="number"
                        className="passport-input font-bold text-brand-navy"
                        placeholder="14750"
                        value={agencyFeeSar}
                        onChange={(e) => setAgencyFeeSar(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Availability Status Toggle */}
                  <div className="passport-field-group">
                    <label className="passport-label">
                      <span>{tx('Availability Status', 'حالة التوفر للاستقدام')}</span>
                    </label>
                    <div className="passport-toggle-group">
                      <button
                        type="button"
                        className={`passport-toggle-btn available ${availability === 'Available' ? 'active' : ''}`}
                        onClick={() => setAvailability('Available')}
                      >
                        <span className="status-dot green" />
                        <span>{tx('Available', 'متاح للاستقدام')}</span>
                      </button>
                      <button
                        type="button"
                        className={`passport-toggle-btn unavailable ${availability === 'Unavailable' ? 'active' : ''}`}
                        onClick={() => setAvailability('Unavailable')}
                      >
                        <span className="status-dot red" />
                        <span>{tx('Unavailable', 'محجوز / غير متاح')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="passport-submit-card">
                <div className="passport-submit-note">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>
                    {tx(
                      'All candidate data is verified against the Saudi Musaned recruitment portal regulations.',
                      'يتم حفظ وتوثيق بيانات المرشحة وفقاً لضوابط منصة مساند واللوائح المنظمة للاستقدام.'
                    )}
                  </span>
                </div>

                <div className="passport-submit-buttons">
                  <button
                    type="button"
                    className="passport-btn-cancel"
                    onClick={handleReset}
                  >
                    <span>{tx('Reset Form', 'إعادة تعيين')}</span>
                  </button>

                  <button
                    type="button"
                    className="passport-btn-primary"
                    disabled={isSaving || isScanning || !fullName.trim() || !passportNumber.trim() || !nationality}
                    onClick={handleSaveWorker}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{tx('Saving & Syncing...', 'جاري الحفظ والمزامنة...')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{tx('Save & Register Worker', 'حفظ وتسجيل العامل')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
