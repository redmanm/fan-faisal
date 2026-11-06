'use client'

import useSWR, { mutate } from 'swr'
import {
  useEffect, useRef, useState, useMemo, useCallback, useTransition, useDeferredValue, memo
} from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronDown, Eye, ImagePlus, LockKeyhole, LogOut, Menu, Pencil, Plus, RotateCcw,
  Search, SlidersHorizontal, Trash2, Upload, UserRound, LayoutDashboard, Users, Building2,
  MessageSquare, Settings, ShieldCheck, TrendingUp, UserCheck, Globe, Clock, Sparkles,
  ArrowUpRight, Download, FileText, CheckCircle2, AlertCircle, Calendar, ChevronRight,
  Phone, Mail, RefreshCw, Briefcase, BadgeCheck, HelpCircle, X, ChevronLeft, Layers,
  ShieldAlert, Award, ArrowRight, UserPlus, Coins, Home, Star, Activity, Filter, Bell,
  MessageCircle, Send, CheckCheck, ScanLine
} from 'lucide-react'
import { neonClient } from '@/lib/neon/client'
import { CVPreview } from '@/components/cv-preview'
import { RegisterByPassportView } from '@/components/register-by-passport'

const logoUrl = '/fan-alfaisal-logo.png'

type Country = { country: string; employer: string; years: string }
type Worker = {
  id: string; name: string; role: string; country: string; status: string; portrait: string;
  passportPhoto: string; age: string; experience: string; experienceCountry?: string; gender: string; religion: string;
  maritalStatus: string; children: string; availability: string; skills: string[];
  birthDate: string; passport: string; fee: number; weight?: string; height?: string
}
type WorkerRow = {
  id: string; full_name: string; job_title: string; nationality: string; birth_date: string | null;
  age: number | null; gender: string | null; religion: string | null; marital_status: string | null;
  children: number | null; experience_years: number | null; experience_country?: string | null; availability: string | null;
  skills: string[]; portrait_data: string | null; passport_data: string | null;
  passport_number: string | null; fee_sar: number | null
}
const experienceCountryOptions = [
  { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  { en: 'Dubai (UAE)', ar: 'دبي (الإمارات)' },
  { en: 'Kuwait', ar: 'الكويت' },
  { en: 'Bahrain', ar: 'البحرين' },
  { en: 'Qatar', ar: 'قطر' },
  { en: 'Oman', ar: 'عُمان' },
  { en: 'Other', ar: 'أخرى' }
]
type FeeRow = { country: string; fee_sar: number }

type SponsorItem = {
  id: string; name: string; contactPerson: string; phone: string; city: string;
  activeRequests: number; totalPlaced: number; status: 'Active' | 'VIP' | 'Pending'; verified: boolean
}
type InquiryItem = {
  id: string; sponsorName: string; requestedRole: string; preferredNationality: string;
  date: string; phone: string; status: 'New' | 'In Process' | 'Assigned' | 'Closed'; notes: string;
  assignedWorkerId?: string
}

const skillOptions = ['Cooking', 'Childcare', 'Elderly care', 'Cleaning & organization']
const nationalityOptions = [
  { en: 'The Philippines', ar: 'الفلبين', flag: '🇵🇭' },
  { en: 'Indonesia', ar: 'إندونيسيا', flag: '🇮🇩' },
  { en: 'Kenya', ar: 'كينيا', flag: '🇰🇪' },
  { en: 'Uganda', ar: 'أوغندا', flag: '🇺🇬' },
  { en: 'Ethiopia', ar: 'إثيوبيا', flag: '🇪🇹' },
  { en: 'India', ar: 'الهند', flag: '🇮🇳' },
  { en: 'Sri Lanka', ar: 'سريلانكا', flag: '🇱🇰' },
  { en: 'Bangladesh', ar: 'بنغلاديش', flag: '🇧🇩' },
  { en: 'Burundi', ar: 'بوروندي', flag: '🇧🇮' },
  { en: 'Egypt', ar: 'مصر', flag: '🇪🇬' },
  { en: 'Ghana', ar: 'غانا', flag: '🇬🇭' },
  { en: 'Malaysia', ar: 'ماليزيا', flag: '🇲🇾' },
  { en: 'New Zealand', ar: 'نيوزيلندا', flag: '🇳🇿' },
  { en: 'Pakistan', ar: 'باكستان', flag: '🇵🇰' },
  { en: 'Rwanda', ar: 'رواندا', flag: '🇷🇼' },
  { en: 'Sudan', ar: 'السودان', flag: '🇸🇩' },
  { en: 'Tanzania', ar: 'تنزانيا', flag: '🇹🇿' },
  { en: 'Thailand', ar: 'تايلاند', flag: '🇹🇭' },
  { en: 'Uzbekistan', ar: 'أوزبكستان', flag: '🇺🇿' },
  { en: 'Yemen', ar: 'اليمن', flag: '🇾🇪' },
]
const nationalityMap = Object.fromEntries(
  nationalityOptions.flatMap(({ en, ar, flag }) => [[en, { en, ar, flag }], [ar, { en, ar, flag }]])
) as Record<string, { en: string; ar: string; flag: string }>

const jobTitleOptions = ['Domestic Worker', 'Driver', 'Housekeeper', 'Childcare Worker', 'Cook', 'Elderly Caregiver']

const defaultFeeSettings: FeeRow[] = [
  { country: 'The Philippines', fee_sar: 14750 },
  { country: 'Indonesia', fee_sar: 15500 },
  { country: 'Sri Lanka', fee_sar: 13800 },
  { country: 'Kenya', fee_sar: 9800 },
  { country: 'Uganda', fee_sar: 8500 },
  { country: 'Ethiopia', fee_sar: 7500 },
  { country: 'India', fee_sar: 12500 },
  { country: 'Bangladesh', fee_sar: 11200 },
  { country: 'Burundi', fee_sar: 8900 },
  { country: 'Ghana', fee_sar: 9200 },
  { country: 'Rwanda', fee_sar: 8800 },
  { country: 'Tanzania', fee_sar: 9400 },
  { country: 'Sudan', fee_sar: 10500 },
  { country: 'Egypt', fee_sar: 11000 },
  { country: 'Uzbekistan', fee_sar: 16500 },
  { country: 'Thailand', fee_sar: 17000 },
  { country: 'Malaysia', fee_sar: 16000 },
  { country: 'Pakistan', fee_sar: 10000 },
  { country: 'Yemen', fee_sar: 9500 },
]

const initialDemoWorkers: WorkerRow[] = [
  {
    id: 'wp-1',
    full_name: 'Maria Santos',
    job_title: 'Domestic Worker',
    nationality: 'The Philippines',
    birth_date: '1998-05-14',
    age: 28,
    gender: 'Female',
    religion: 'Christianity',
    marital_status: 'Married',
    children: 2,
    experience_years: 4,
    availability: 'Available',
    skills: ['Cooking', 'Childcare', 'Cleaning & organization'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'P8921445',
    fee_sar: 14750
  },
  {
    id: 'wp-2',
    full_name: 'Siti Rahmawati',
    job_title: 'Housekeeper',
    nationality: 'Indonesia',
    birth_date: '1994-02-18',
    age: 32,
    gender: 'Female',
    religion: 'Islam',
    marital_status: 'Married',
    children: 1,
    experience_years: 5,
    availability: 'Available',
    skills: ['Cooking', 'Cleaning & organization', 'Elderly care'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'A4892011',
    fee_sar: 15500
  },
  {
    id: 'wp-3',
    full_name: 'Amina Mwangi',
    job_title: 'Childcare Worker',
    nationality: 'Kenya',
    birth_date: '2000-08-22',
    age: 26,
    gender: 'Female',
    religion: 'Christianity',
    marital_status: 'Single',
    children: 0,
    experience_years: 3,
    availability: 'Available',
    skills: ['Childcare', 'Cooking'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'AK992014',
    fee_sar: 9800
  },
  {
    id: 'wp-4',
    full_name: 'Rajesh Kumar',
    job_title: 'Driver',
    nationality: 'India',
    birth_date: '1991-11-03',
    age: 35,
    gender: 'Male',
    religion: 'Hinduism',
    marital_status: 'Married',
    children: 2,
    experience_years: 7,
    availability: 'Available',
    skills: ['Cleaning & organization'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'Z1892004',
    fee_sar: 12500
  },
  {
    id: 'wp-5',
    full_name: 'Fatima Al-Hassan',
    job_title: 'Cook',
    nationality: 'Ethiopia',
    birth_date: '1997-04-12',
    age: 29,
    gender: 'Female',
    religion: 'Islam',
    marital_status: 'Single',
    children: 0,
    experience_years: 4,
    availability: 'In process',
    skills: ['Cooking', 'Cleaning & organization'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'ET771239',
    fee_sar: 7500
  },
  {
    id: 'wp-6',
    full_name: 'Kavitha Perera',
    job_title: 'Domestic Worker',
    nationality: 'Sri Lanka',
    birth_date: '1996-09-09',
    age: 30,
    gender: 'Female',
    religion: 'Buddhism',
    marital_status: 'Married',
    children: 1,
    experience_years: 5,
    availability: 'Available',
    skills: ['Cooking', 'Elderly care', 'Childcare'],
    portrait_data: null,
    passport_data: null,
    passport_number: 'N5521990',
    fee_sar: 13800
  }
]

const initialSponsors: SponsorItem[] = [
  { id: 'sp-1', name: 'Al-Rajhi Family', contactPerson: 'Mohammed Al-Rajhi', phone: '+966 50 123 4567', city: 'Riyadh', activeRequests: 2, totalPlaced: 5, status: 'VIP', verified: true },
  { id: 'sp-2', name: 'Al-Otaibi Household', contactPerson: 'Fahad Al-Otaibi', phone: '+966 55 987 6543', city: 'Jeddah', activeRequests: 1, totalPlaced: 3, status: 'Active', verified: true },
  { id: 'sp-3', name: 'Al-Qahtani Residence', contactPerson: 'Nasser Al-Qahtani', phone: '+966 54 321 0987', city: 'Dammam', activeRequests: 1, totalPlaced: 2, status: 'Active', verified: true },
  { id: 'sp-4', name: 'Al-Ghamdi Family', contactPerson: 'Sultan Al-Ghamdi', phone: '+966 56 654 3210', city: 'Khobar', activeRequests: 3, totalPlaced: 4, status: 'VIP', verified: true },
  { id: 'sp-5', name: 'Al-Tamimi Services', contactPerson: 'Saad Al-Tamimi', phone: '+966 50 555 4321', city: 'Riyadh', activeRequests: 1, totalPlaced: 1, status: 'Pending', verified: false },
]

const initialInquiries: InquiryItem[] = [
  { id: 'inq-1', sponsorName: 'Al-Rajhi Family', requestedRole: 'Domestic Worker', preferredNationality: 'The Philippines', date: '25 mins ago', phone: '+966 50 123 4567', status: 'New', notes: 'Experienced with large family and elderly assistance.' },
  { id: 'inq-2', sponsorName: 'Al-Otaibi Household', requestedRole: 'Driver', preferredNationality: 'India', date: '2 hours ago', phone: '+966 55 987 6543', status: 'In Process', notes: 'Valid Saudi driver license preferred.' },
  { id: 'inq-3', sponsorName: 'Al-Qahtani Residence', requestedRole: 'Childcare Worker', preferredNationality: 'Kenya', date: 'Yesterday', phone: '+966 54 321 0987', status: 'Assigned', notes: 'English speaking with newborn experience.', assignedWorkerId: 'wp-3' },
  { id: 'inq-4', sponsorName: 'Al-Ghamdi Family', requestedRole: 'Cook', preferredNationality: 'Indonesia', date: '2 days ago', phone: '+966 56 654 3210', status: 'New', notes: 'Traditional Gulf and Arabic cooking skills needed.' },
]

export default function Page() {
  const router = useRouter()
  const [isNavPending, startNavTransition] = useTransition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Streamlined outside click listener: only attached when popovers are active
  useEffect(() => {
    if (!profileOpen && !notificationsOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [profileOpen, notificationsOpen])

  const [language, setLanguage] = useState<'en' | 'ar'>(() =>
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
  )
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [globalSearch, setGlobalSearch] = useState('')
  const deferredGlobalSearch = useDeferredValue(globalSearch)
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Check URL query param ?nav= on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const navParam = params.get('nav')
      if (navParam && ['Dashboard', 'Workers', 'Register by Passport', 'Sponsors', 'Inquiries', 'Settings', 'User access'].includes(navParam)) {
        setActiveNav(navParam)
      }
    }
  }, [])

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K to jump to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = document.getElementById('header-global-search') as HTMLInputElement | null
        if (el) {
          el.focus()
          el.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { data: authContext } = useSWR('rbac-session', async () => {
    try {
      const { data: { user } } = await neonClient.auth.getUser()
      if (!user) return { user: null, role: 'sponsor' as const }
      const { data } = await neonClient.rpc('current_user_role')
      return { user, role: (data || 'sponsor') as 'super_admin' | 'admin' | 'sponsor' }
    } catch {
      return { user: null, role: 'sponsor' as const }
    }
  })

  const role = authContext?.role || 'sponsor'
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'

  const [addWorkerOpen, setAddWorkerOpen] = useState(false)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [saved, setSaved] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3500)
  }, [])

  const isArabic = language === 'ar'
  const tx = useCallback((english: string, arabic: string) => (language === 'ar' ? arabic : english), [language])

  useEffect(() => {
    const savedLanguage = authContext?.user?.user_metadata?.language
    if (savedLanguage === 'ar' || savedLanguage === 'en') setLanguage(savedLanguage)
  }, [authContext?.user?.user_metadata?.language])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [language, isArabic])

  const changeLanguage = useCallback((nextLanguage: 'en' | 'ar') => {
    setLanguage(nextLanguage)
    if (authContext?.user) {
      neonClient.auth.updateUser({ data: { ...authContext.user.user_metadata, language: nextLanguage } }).catch(() => {})
    }
  }, [authContext?.user])

  const navItems = isSuperAdmin
    ? ['Dashboard', 'Workers', 'Register by Passport', 'Sponsors', 'Inquiries', 'Settings', 'User access']
    : isAdmin
    ? ['Dashboard', 'Workers', 'Register by Passport', 'Sponsors', 'Inquiries', 'Settings']
    : ['Workers']

  const navArabic: Record<string, string> = {
    Dashboard: 'لوحة التحكم',
    Workers: 'العمال والسير الذاتية',
    'Register by Passport': 'التسجيل عبر الجواز',
    Sponsors: 'الكفلاء',
    Inquiries: 'الطلبات والاستفسارات',
    Settings: 'رسوم الدول والإعدادات',
    'User access': 'صلاحيات المستخدمين'
  }

  // Worker form & detail state
  const [portrait, setPortrait] = useState('')
  const [passport, setPassport] = useState('')
  const [skills, setSkills] = useState<string[]>(['Cooking', 'Childcare'])
  const [published, setPublished] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileJob, setProfileJob] = useState('')
  const [profileNationality, setProfileNationality] = useState('')
  const [profileExperience, setProfileExperience] = useState('')
  const [profileGender, setProfileGender] = useState('')
  const [profileChildren, setProfileChildren] = useState('')
  const [profileAge, setProfileAge] = useState('')
  const [profileReligion, setProfileReligion] = useState('')
  const [profileMaritalStatus, setProfileMaritalStatus] = useState('')
  const [profileAvailability, setProfileAvailability] = useState('')
  const [profileSalary, setProfileSalary] = useState('1500')
  const [profileWeight, setProfileWeight] = useState('')
  const [profileHeight, setProfileHeight] = useState('')
  const [profilePassportNumber, setProfilePassportNumber] = useState('')
  const [profileSkills, setProfileSkills] = useState<string[]>([])
  const [maritalStatus, setMaritalStatus] = useState('Single')
  const [birthDate, setBirthDate] = useState('')
  const [calculatedAge, setCalculatedAge] = useState('')
  const [experience, setExperience] = useState('0')
  const [hasExperience, setHasExperience] = useState(false)
  const [experienceCountry, setExperienceCountry] = useState('')
  const [experienceCountryOther, setExperienceCountryOther] = useState('')

  // Data fetching with resilient fallbacks
  const { data: feeRows = defaultFeeSettings, mutate: refreshFees } = useSWR<FeeRow[]>('country_fee_settings', async () => {
    try {
      const { data, error } = await neonClient.from('country_fee_settings').select('country,fee_sar').order('country')
      if (error || !data || data.length === 0) return defaultFeeSettings
      return data
    } catch {
      return defaultFeeSettings
    }
  })
  const feeByCountry = useMemo(() => Object.fromEntries(feeRows.map((row) => [row.country, row.fee_sar])), [feeRows])
  const currentFee = feeByCountry[profileNationality] ?? 0

  const { data: workerRows = initialDemoWorkers, mutate: mutateWorkerRows, isLoading: workersLoading } = useSWR<WorkerRow[]>('worker_profiles', async () => {
    try {
      const { data, error } = await neonClient.from('worker_profiles').select(
        'id,full_name,job_title,nationality,birth_date,age,gender,religion,marital_status,children,experience_years,experience_country,availability,skills,portrait_data,passport_data,passport_number,fee_sar'
      ).order('created_at', { ascending: false })
      if (error || !data || data.length === 0) return initialDemoWorkers
      return data
    } catch {
      return initialDemoWorkers
    }
  })

  const refreshWorkers = useCallback(async () => {
    await mutateWorkerRows()
  }, [mutateWorkerRows])

  const workers: Worker[] = useMemo(() => workerRows.map((row) => ({
    id: row.id,
    name: row.full_name,
    role: row.job_title,
    country: row.nationality,
    status: row.availability || 'Available',
    portrait: row.portrait_data || '',
    passportPhoto: row.passport_data || '',
    age: row.age == null ? '' : String(row.age),
    experience: row.experience_years == null ? '0' : String(row.experience_years),
    experienceCountry: row.experience_country || '',
    gender: row.gender || '',
    religion: row.religion || '',
    maritalStatus: row.marital_status || '',
    children: row.children == null ? '0' : String(row.children),
    availability: row.availability || 'Available',
    skills: row.skills || [],
    birthDate: row.birth_date || '',
    passport: row.passport_number || '',
    fee: row.fee_sar ?? feeByCountry[row.nationality] ?? 14500,
    weight: '55',
    height: '160'
  })), [workerRows, feeByCountry])

  const portraitInput = useRef<HTMLInputElement>(null)
  const passportInput = useRef<HTMLInputElement>(null)

  function readImage(file: File, setter: (value: string) => void) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setter(String(reader.result))
    reader.readAsDataURL(file)
  }

  // Handle "+ Add Worker" / "+ Add Candidate": fresh empty form
  const handleAddNewWorker = useCallback(() => {
    setEditingWorkerId(null)
    setProfileName('')
    setProfileJob(isArabic ? 'عاملة منزلية' : 'Domestic Worker')
    setProfileNationality('')
    setProfileExperience('0')
    setExperience('0')
    setHasExperience(false)
    setExperienceCountry('')
    setExperienceCountryOther('')
    setProfileGender(isArabic ? 'أنثى' : 'Female')
    setProfileChildren('0')
    setProfileAge('')
    setProfileReligion('Islam')
    setProfileMaritalStatus('Single')
    setMaritalStatus('Single')
    setProfileAvailability('Available')
    setProfileSalary('1500')
    setProfileWeight('')
    setProfileHeight('')
    setProfileSkills(['Cooking', 'Childcare'])
    setSkills(['Cooking', 'Childcare'])
    setBirthDate('')
    setCalculatedAge('')
    setPortrait('')
    setPassport('')
    setProfilePassportNumber('')
    setAddWorkerOpen(true)
  }, [isArabic])

  // Handle "Edit Worker": prefill existing worker data
  const handleEditWorker = useCallback((worker: Worker) => {
    setEditingWorkerId(worker.id)
    setProfileName(worker.name)
    setProfileJob(worker.role)
    setProfileNationality(worker.country)
    setProfileAge(worker.age)
    setCalculatedAge(worker.age)
    setProfileExperience(worker.experience)
    setExperience(worker.experience || '0')
    const expNum = Number(worker.experience) || 0
    const hasExp = expNum > 0 || Boolean(worker.experienceCountry)
    setHasExperience(hasExp)
    if (worker.experienceCountry) {
      const knownCountries = ['Saudi Arabia', 'Dubai (UAE)', 'Kuwait', 'Bahrain', 'Qatar', 'Oman']
      if (knownCountries.includes(worker.experienceCountry)) {
        setExperienceCountry(worker.experienceCountry)
        setExperienceCountryOther('')
      } else {
        setExperienceCountry('Other')
        setExperienceCountryOther(worker.experienceCountry)
      }
    } else {
      setExperienceCountry(hasExp ? 'Saudi Arabia' : '')
      setExperienceCountryOther('')
    }
    setProfileGender(worker.gender)
    setProfileReligion(worker.religion)
    setProfileMaritalStatus(worker.maritalStatus)
    setMaritalStatus(worker.maritalStatus || 'Single')
    setProfileChildren(worker.children)
    setProfileAvailability(worker.availability)
    setProfileSkills(worker.skills || [])
    setSkills(worker.skills || [])
    setBirthDate(worker.birthDate)
    setPortrait(worker.portrait)
    setPassport(worker.passportPhoto)
    setProfilePassportNumber(worker.passport || '')
    setProfileWeight(worker.weight || '55')
    setProfileHeight(worker.height || '160')
    setAddWorkerOpen(true)
  }, [])

  // Full submission handler for both Insert and Update with OPTIMISTIC UI
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || profileName)
    const jobTitle = String(data.get('jobTitle') || profileJob)
    const nationality = String(data.get('nationality') || profileNationality).trim()

    if (!nationality) {
      showToast(tx('Please select candidate nationality *', 'يرجى اختيار جنسية المرشح *'))
      return
    }

    const expYears = hasExperience ? (Number(data.get('experience')) || Number(experience) || 0) : 0
    const rawExpCountry = hasExperience
      ? (experienceCountry === 'Other' ? (experienceCountryOther || 'Other') : (experienceCountry || String(data.get('experienceCountry') || '')))
      : null

    const gender = String(data.get('gender') || profileGender)
    const marital = String(data.get('maritalStatus') || maritalStatus)
    const childrenCount = marital === 'Single' ? 0 : (Number(data.get('children')) || Number(profileChildren) || 0)
    const ageVal = Number(data.get('age')) || (calculatedAge ? Number(calculatedAge) : 25)
    const religion = String(data.get('religion') || profileReligion)
    const availability = String(data.get('availability') || profileAvailability || 'Available')
    const passportNumber = String(data.get('passportNumber') || '')

    setProfileName(name)
    setProfileJob(jobTitle)
    setProfileNationality(nationality)
    setProfileExperience(String(expYears))
    setProfileGender(gender)
    setProfileChildren(String(childrenCount))
    setProfileAge(ageVal ? String(ageVal) : '')
    setProfileReligion(religion)
    setProfileMaritalStatus(marital)
    setProfileAvailability(availability)
    setProfileSalary(String(data.get('salary') || '1500'))
    setProfileWeight(String(data.get('weight') || ''))
    setProfileHeight(String(data.get('height') || ''))
    setProfileSkills(skills)

    const workerData = {
      full_name: name,
      job_title: jobTitle,
      nationality,
      birth_date: birthDate || null,
      age: ageVal,
      gender,
      religion,
      marital_status: marital,
      children: childrenCount,
      experience_years: expYears,
      experience_country: rawExpCountry,
      availability,
      skills,
      portrait_data: portrait || null,
      passport_data: passport || null,
      passport_number: passportNumber || null,
      fee_sar: feeByCountry[nationality] ?? 14500
    }

    const previousRows = workerRows
    const currentEditingId = editingWorkerId

    // 1. INSTANT OPTIMISTIC UI: Close modal immediately (0ms delay)
    setAddWorkerOpen(false)
    setEditingWorkerId(null)

    if (currentEditingId) {
      // Optimistically update local SWR state immediately
      mutateWorkerRows((prev = []) =>
        prev.map((row) =>
          row.id === currentEditingId
            ? {
                ...row,
                ...workerData,
                age: ageVal,
                children: childrenCount,
                experience_years: expYears,
                experience_country: rawExpCountry,
              }
            : row
        ),
        false
      )
      showToast(tx('Candidate profile updated successfully', 'تم تحديث ملف المرشح بنجاح'))

      // Background persistence with rollback on failure
      ;(async () => {
        try {
          const { error } = await neonClient
            .from('worker_profiles')
            .update(workerData)
            .eq('id', currentEditingId)
          if (error) throw error
        } catch (err) {
          console.warn('Neon update failed, rolling back:', err)
          mutateWorkerRows(previousRows, false)
          showToast(tx('Failed to update candidate. Changes rolled back.', 'فشل تحديث ملف المرشح. تم التراجع عن التعديلات.'))
        }
      })()
    } else {
      // Optimistically prepend to local SWR state immediately
      const tempId = 'wp-' + Date.now()
      mutateWorkerRows((prev = []) => [
        {
          id: tempId,
          ...workerData,
          age: ageVal,
          children: childrenCount,
          experience_years: expYears,
          experience_country: rawExpCountry,
        },
        ...prev
      ], false)
      showToast(tx('Candidate published to Musaned portal', 'تم نشر ملف المرشح في منصة مساند'))

      // Background insertion with rollback on failure
      ;(async () => {
        try {
          const { data: inserted, error } = await neonClient
            .from('worker_profiles')
            .insert({ ...workerData })
            .select('id')
            .single()
          if (error) throw error
          if (inserted?.id && inserted.id !== tempId) {
            // Swap temporary id with the permanent server id
            mutateWorkerRows((prev = []) =>
              prev.map((r) => r.id === tempId ? { ...r, id: inserted.id } : r),
              false
            )
          }
        } catch (err) {
          console.warn('Neon insert failed, rolling back:', err)
          mutateWorkerRows(previousRows, false)
          showToast(tx('Failed to publish candidate. Rolled back.', 'فشل نشر ملف المرشح. تم التراجع.'))
        }
      })()
    }
  }

  const handleOpenWorker = useCallback((worker: Worker) => {
    setProfileName(worker.name)
    setProfileJob(worker.role)
    setProfileNationality(worker.country)
    setProfileAge(worker.age)
    setProfileExperience(worker.experience)
    setExperienceCountry(worker.experienceCountry || '')
    setHasExperience(Number(worker.experience) > 0 || Boolean(worker.experienceCountry))
    setProfileGender(worker.gender)
    setProfileReligion(worker.religion)
    setProfileMaritalStatus(worker.maritalStatus)
    setProfileChildren(worker.children)
    setProfileAvailability(worker.availability)
    setProfileSkills(worker.skills)
    setBirthDate(worker.birthDate)
    setCalculatedAge(worker.age)
    setPortrait(worker.portrait)
    setPassport(worker.passportPhoto)
    setProfilePassportNumber(worker.passport || '')
    setProfileWeight(worker.weight || '55')
    setProfileHeight(worker.height || '160')
    setPublished(true)
  }, [])

  // OPTIMISTIC UI: Instant status toggle on candidate cards with graceful rollback
  const handleToggleAvailability = useCallback(async (worker: Worker) => {
    const isAvail = worker.status === 'Available' || worker.status === 'متاح'
    const nextStatus = isAvail ? 'Unavailable' : 'Available'
    const previousRows = workerRows

    // 1. INSTANT OPTIMISTIC LOCAL STATE UPDATE (0ms latency, zero delay visual reflection)
    mutateWorkerRows((prev = []) =>
      prev.map((r) => (r.id === worker.id ? { ...r, availability: nextStatus } : r)),
      false
    )
    showToast(tx(
      `Status updated to ${nextStatus}`,
      `تم تغيير الحالة إلى ${nextStatus === 'Available' ? 'متاح' : 'غير متاح'}`
    ))

    // 2. ASYNC BACKGROUND NETWORK SYNC (never blocks user interaction)
    try {
      const { error } = await neonClient.from('worker_profiles').update({ availability: nextStatus }).eq('id', worker.id)
      if (error) throw error
    } catch (err) {
      console.warn('Toggle status update failed, rolling back to previous state:', err)
      // 3. GRACEFUL ROLLBACK on server error
      mutateWorkerRows(previousRows, false)
      showToast(tx('Failed to update status on server. Rolled back.', 'فشل تحديث الحالة في الخادم. تم استرجاع الحالة السابقة.'))
    }
  }, [workerRows, mutateWorkerRows, tx])

  // OPTIMISTIC UI: Instant candidate deletion with rollback
  const handleDeleteWorker = useCallback((worker: Worker) => {
    setDeleteTarget(worker)
  }, [])

  const handleDeleteWorkerConfirm = useCallback(async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    const previousRows = workerRows
    setDeleteTarget(null) // Instant modal close

    // 1. Optimistic removal from UI
    mutateWorkerRows((prev = []) => prev.filter((r) => r.id !== target.id), false)
    showToast(tx('Profile deleted successfully', 'تم حذف الملف بنجاح'))

    // 2. Background delete
    try {
      const { error } = await neonClient.from('worker_profiles').delete().eq('id', target.id)
      if (error) throw error
    } catch (err) {
      console.warn('Delete failed on server, rolling back:', err)
      mutateWorkerRows(previousRows, false)
      showToast(tx('Failed to delete profile. Restored.', 'فشل حذف الملف. تمت استعادة الملف.'))
    }
  }, [deleteTarget, workerRows, mutateWorkerRows, tx])

  // STREAMLINED INSTANT LOGOUT: immediate visual response, non-blocking auth clear
  const handleLogout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    setProfileOpen(false)

    // 1. Clear local session cache immediately
    mutate('rbac-session', { user: null, role: 'sponsor' }, false)

    // 2. Fast background signOut with non-blocking race timeout
    try {
      const signOutPromise = neonClient.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 150))
      await Promise.race([signOutPromise, timeoutPromise])
    } catch {
      // ignore
    }

    // 3. Instant client router redirect
    router.replace('/auth/login')
  }, [loggingOut, router])

  // NON-BLOCKING NAVIGATION: tab switching using startTransition for 60fps responsiveness
  const handleNavChange = useCallback((item: string) => {
    setMobileOpen(false)
    startNavTransition(() => {
      setActiveNav(item)
    })
  }, [])

  const handleNavigateWithFilter = useCallback((view: string, filter?: string) => {
    startNavTransition(() => {
      setActiveNav(view)
      if (filter) setCategoryFilter(filter)
    })
  }, [])

  const navIcons: Record<string, React.ReactNode> = {
    Dashboard: <LayoutDashboard />,
    Workers: <Users />,
    'Register by Passport': <ScanLine />,
    Sponsors: <Building2 />,
    Inquiries: <MessageSquare />,
    Settings: <Settings />,
    'User access': <ShieldCheck />
  }

  // Sponsor Account: Dedicated view matching user's exact uploaded design (NO dashboard, NO sidebar)
  if (role === 'sponsor') {
    return (
      <SponsorPortal
        workers={workers}
        loading={workersLoading}
        language={language}
        userEmail={authContext?.user?.email || 'sponsor@fanfaisal.sa'}
        onLanguageChange={changeLanguage}
        onOpenWorker={handleOpenWorker}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        published={published}
        profileName={profileName}
        profileJob={profileJob}
        profileNationality={profileNationality}
        profileAge={profileAge}
        profileExperience={profileExperience}
        profileReligion={profileReligion}
        profileMaritalStatus={profileMaritalStatus}
        profileChildren={profileChildren}
        profileSalary={profileSalary}
        currentFee={currentFee}
        profileWeight={profileWeight}
        profileHeight={profileHeight}
        profileSkills={profileSkills}
        portrait={portrait}
        profileGender={profileGender}
        profileAvailability={profileAvailability}
        profilePassportNumber={profilePassportNumber}
        onCloseCV={() => setPublished(false)}
      />
    )
  }

  return (
    <div className={`portal-shell ${isArabic ? 'rtl-mode' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} lang={language}>
      {/* Sidebar */}
      <aside className={`portal-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src={logoUrl} alt="Fan AlFaisal Recruitment Company" />
          <div className="sidebar-brand-text">
            <strong>Fan Al Faisal</strong>
            <span>{isArabic ? 'شركة فن الفيصل للاستقدام' : 'Recruitment Co.'}</span>
            <span className="musaned-badge">
              <BadgeCheck /> {tx('Musaned Certified', 'معتمد من مساند')}
            </span>
          </div>
        </div>

        <nav aria-label={tx('Main navigation', 'التنقل الرئيسي')}>
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`sidebar-nav-btn ${activeNav === item ? 'selected' : ''}`}
              onClick={() => handleNavChange(item)}
            >
              <div className="sidebar-nav-left">
                {navIcons[item]}
                <span>{isArabic ? navArabic[item] : item}</span>
              </div>
              {item === 'Workers' && workers.length > 0 && (
                <span className="nav-counter">{workers.length}</span>
              )}
              {item === 'Inquiries' && (
                <span className="nav-counter pulse-alert">4</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status-pill">
            <span className="live-pulse" />
            <span>{tx('Musaned Live Sync · Active', 'ربط مساند المباشر · متصل')}</span>
          </div>
          <div className="support-callout">
            <span>{tx('Unified Support', 'الرقم الموحد')}</span>
            <strong>920006629</strong>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label={tx('Close menu', 'إغلاق القائمة')}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="portal-main">
        {/* Header */}
        <header className="portal-header">
          <div className="header-left">
            <button
              className="menu-trigger"
              onClick={() => setMobileOpen(true)}
              aria-label={tx('Open navigation', 'فتح القائمة')}
            >
              <Menu />
            </button>
            <div className="crumb">
              <Home className="crumb-home-icon" />
              <span>Fan AlFaisal</span>
              <span className="crumb-separator">/</span>
              <strong>{isArabic ? navArabic[activeNav] || activeNav : activeNav}</strong>
            </div>
            <span className={`header-role-pill ${role}`}>
              <ShieldAlert style={{ width: 12, height: 12 }} />
              {role === 'super_admin' ? tx('Super Admin', 'المدير الأعلى') : role === 'admin' ? tx('Admin', 'المدير') : tx('Sponsor', 'الكفيل')}
            </span>
          </div>

          <div className="header-actions">
            {/* Global Quick Search with Cmd+K listener */}
            <div className="header-search-wrap">
              <Search />
              <input
                id="header-global-search"
                className="header-search-input"
                placeholder={tx('Quick search candidates… (Ctrl+K)', 'بحث سريع عن المرشحين… (Ctrl+K)')}
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value)
                  if (activeNav !== 'Workers' && e.target.value.trim()) {
                    handleNavChange('Workers')
                  }
                }}
              />
              <span className="header-search-kbd">⌘K</span>
            </div>

            {/* Language Switch Pill */}
            <button
              type="button"
              className="header-lang-btn"
              onClick={() => changeLanguage(isArabic ? 'en' : 'ar')}
              title={tx('Switch language', 'تغيير اللغة')}
            >
              <Globe />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>

            {/* Add Worker Action */}
            {isAdmin && (
              <button
                type="button"
                className="header-add-btn"
                onClick={handleAddNewWorker}
              >
                <Plus />
                <span>{tx('Add Worker', 'إضافة عامل')}</span>
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                className="notification-trigger"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label={tx('Notifications', 'الإشعارات')}
              >
                <Bell />
                <span className="notification-badge-dot" />
              </button>

              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="notification-header">
                    <strong>{tx('Operational Activity', 'النشاط التشغيلي')}</strong>
                    <span>3 {tx('New', 'جديد')}</span>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <div className="notification-icon blue"><Users /></div>
                      <div className="notification-copy">
                        <strong>{tx('New inquiry from Al-Rajhi Family', 'طلب استقدام جديد من عائلة الراجحي')}</strong>
                        <small>{tx('Domestic Worker from Philippines · 25m ago', 'عاملة منزلية من الفلبين · منذ 25 دقيقة')}</small>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-icon green"><CheckCircle2 /></div>
                      <div className="notification-copy">
                        <strong>{tx('Candidate profile verified', 'تم اعتماد ملف مرشح جديد')}</strong>
                        <small>{tx('Medical & police check cleared · 1h ago', 'الفحص الطبي والجنائي مكتمل · منذ ساعة')}</small>
                      </div>
                    </div>
                    <div className="notification-item">
                      <div className="notification-icon amber"><Coins /></div>
                      <div className="notification-copy">
                        <strong>{tx('Fee table synchronized with Musaned', 'تمت مزامنة جدول الرسوم مع مساند')}</strong>
                        <small>{tx('Updated for 19 source countries · 3h ago', 'محدّث لـ 19 دولة مصدرة · منذ 3 ساعات')}</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="profile-menu" ref={profileMenuRef}>
              <button
                className="profile-trigger"
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label={tx('Open profile menu', 'فتح قائمة الملف الشخصي')}
              >
                <span className="profile-trigger-avatar">
                  {authContext?.user?.email?.slice(0, 2).toUpperCase() || 'FA'}
                </span>
                <span className="profile-trigger-info">
                  <strong>{authContext?.user?.email?.split('@')[0] || tx('Operations Hub', 'إدارة العمليات')}</strong>
                  <small>{role === 'super_admin' ? tx('Super Admin', 'المدير الأعلى') : role === 'admin' ? tx('Admin', 'المدير') : tx('Sponsor', 'الكفيل')}</small>
                </span>
                <ChevronDown />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-user">
                    <span className="profile-dropdown-avatar">
                      {authContext?.user?.email?.slice(0, 2).toUpperCase() || 'FA'}
                    </span>
                    <div className="profile-dropdown-user-info">
                      <strong>{authContext?.user?.email || 'admin@fanfaisal.sa'}</strong>
                      <span>{role === 'super_admin' ? tx('Full System Authority', 'صلاحيات قيادة النظام بالكامل') : role === 'admin' ? tx('Recruitment Operations', 'إدارة العمليات والسير الذاتية') : tx('Verified Sponsor', 'كفيل معتمد')}</span>
                    </div>
                  </div>

                  <div className="profile-dropdown-lang">
                    <span>{tx('Language / اللغة', 'اللغة / Language')}</span>
                    <div className="profile-dropdown-lang-btns">
                      <button
                        type="button"
                        className={language === 'en' ? 'active' : ''}
                        onClick={() => changeLanguage('en')}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        className={language === 'ar' ? 'active' : ''}
                        onClick={() => changeLanguage('ar')}
                      >
                        العربية
                      </button>
                    </div>
                  </div>

                  <button
                    className="logout-button"
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                  >
                    <LogOut className={loggingOut ? 'animate-spin' : ''} />
                    {loggingOut ? tx('Logging out…', 'جارٍ الخروج…') : tx('Log out', 'تسجيل الخروج')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Router */}
        {activeNav === 'Dashboard' ? (
          <AdminDashboardOverview
            role={role}
            workers={workers}
            feeRows={feeRows}
            language={language}
            userEmail={authContext?.user?.email || 'admin@fanfaisal.sa'}
            onAddWorker={handleAddNewWorker}
            onOpenWorker={handleOpenWorker}
            onEditWorker={handleEditWorker}
            onDeleteWorker={handleDeleteWorker}
            onToggleAvailability={handleToggleAvailability}
            onNavigate={handleNavigateWithFilter}
          />
        ) : activeNav === 'Workers' ? (
          <WorkerDirectory
            view={activeNav}
            role={role}
            workers={workers}
            loading={workersLoading}
            searchInitial={deferredGlobalSearch}
            categoryInitial={categoryFilter}
            feeRows={feeRows}
            language={language}
            onAddWorker={handleAddNewWorker}
            onOpenWorker={handleOpenWorker}
            onDeleteWorker={handleDeleteWorker}
            onToggleAvailability={handleToggleAvailability}
            onEditWorker={handleEditWorker}
          />
        ) : activeNav === 'Register by Passport' ? (
          <RegisterByPassportView
            language={language}
            feeRows={feeRows}
            onWorkerSaved={(newRow) => {
              mutateWorkerRows((prev = []) => [newRow, ...prev], false)
            }}
            onOpenWorker={handleOpenWorker}
            onNavigate={(nav) => handleNavChange(nav)}
            showToast={showToast}
          />
        ) : activeNav === 'Sponsors' ? (
          <SponsorsView language={language} onShowToast={showToast} />
        ) : activeNav === 'Inquiries' ? (
          <InquiriesView
            language={language}
            workers={workers}
            onShowToast={showToast}
          />
        ) : activeNav === 'Settings' ? (
          <CountryFeesSettings
            feeRows={feeRows}
            language={language}
            onRefresh={refreshFees}
            onShowToast={showToast}
          />
        ) : activeNav === 'User access' && isSuperAdmin ? (
          <SuperAdminUserManagement language={language} onShowToast={showToast} />
        ) : (
          <WorkerDirectory
            view="Workers"
            role={role}
            workers={workers}
            loading={workersLoading}
            searchInitial=""
            categoryInitial="All"
            feeRows={feeRows}
            language={language}
            onAddWorker={handleAddNewWorker}
            onOpenWorker={handleOpenWorker}
            onDeleteWorker={handleDeleteWorker}
            onToggleAvailability={handleToggleAvailability}
            onEditWorker={handleEditWorker}
          />
        )}

        {/* Add/Edit Worker Modal */}
        {addWorkerOpen && (
          <div className="worker-modal" role="dialog" aria-modal="true" aria-labelledby="add-worker-title">
            <div className="worker-modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => { setAddWorkerOpen(false); setEditingWorkerId(null) }}
                aria-label={tx('Close form', 'إغلاق النموذج')}
              >
                <X />
              </button>
              <div className="form-page">
                <div className="form-intro">
                  <div>
                    <h1 id="add-worker-title">
                      {editingWorkerId ? tx('Edit Candidate Profile', 'تعديل ملف المرشح') : tx('Candidate Profile Builder', 'إنشاء ملف مرشح استقدام')}
                    </h1>
                    <p>
                      {editingWorkerId
                        ? tx('Update personal, physical, and background specifications according to Musaned regulations.', 'تحديث وتعديل البيانات الشخصية والمهنية للمرشح وفق أنظمة مساند.')
                        : tx('Fill in all personal, physical, and background specifications according to Musaned regulations.', 'أكمل البيانات الشخصية والمهنية والمواصفات الجسدية المعتمدة لنشر السيرة الذاتية.')}
                    </p>
                  </div>
                </div>

                <form onSubmit={submit}>
                  <section className="form-section">
                    <SectionTitle label="A." title={tx('Photos & Identification', 'الصور والوثائق')} />
                    <div className="photo-fields">
                      <PhotoUpload
                        label={tx('Full-size Portrait', 'الصورة الشخصية الكاملة')}
                        value={portrait}
                        inputRef={portraitInput}
                        onSelect={(file) => readImage(file, setPortrait)}
                        onClear={() => setPortrait('')}
                      />
                      <PhotoUpload
                        label={tx('Passport Photo', 'صورة الجواز')}
                        value={passport}
                        compact
                        inputRef={passportInput}
                        onSelect={(file) => readImage(file, setPassport)}
                        onClear={() => setPassport('')}
                      />
                    </div>
                  </section>

                  <section className="form-section">
                    <SectionTitle label="B." title={tx('Personal Information', 'المعلومات الشخصية')} />
                    <div className="fields-grid three">
                      <Field label={tx('Full Legal Name *', 'الاسم القانوني الكامل *')}>
                        <input required name="name" defaultValue={profileName} placeholder={tx('e.g. Maria Santos', 'مثال: ماريا سانتوس')} />
                      </Field>
                      <Field label={tx('Date of Birth', 'تاريخ الميلاد')}>
                        <input
                          name="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => {
                            const val = e.target.value
                            setBirthDate(val)
                            if (!val) return setCalculatedAge('')
                            const today = new Date()
                            const date = new Date(`${val}T00:00:00`)
                            let age = today.getFullYear() - date.getFullYear()
                            const m = today.getMonth() - date.getMonth()
                            if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--
                            setCalculatedAge(age >= 0 ? String(age) : '')
                          }}
                        />
                      </Field>
                      <Field label={tx('Age', 'العمر')}>
                        <input name="age" type="number" min="18" max="65" value={calculatedAge || profileAge || 25} readOnly />
                      </Field>
                      <Field label={tx('Gender', 'الجنس')}>
                        <Select
                          name="gender"
                          options={isArabic ? ['أنثى', 'ذكر'] : ['Female', 'Male']}
                          defaultValue={profileGender || (isArabic ? 'أنثى' : 'Female')}
                        />
                      </Field>
                      <Field label={tx('Nationality *', 'الجنسية *')}>
                        <Select
                          required
                          name="nationality"
                          options={nationalityOptions.map((o) => isArabic ? o.ar : o.en)}
                          value={profileNationality}
                          onChange={(e) => setProfileNationality(e.target.value)}
                          placeholder={tx('Select Nationality', 'اختر الجنسية')}
                        />
                      </Field>
                      <Field label={tx('Passport Number', 'رقم الجواز')}>
                        <div className="locked-input">
                          <input name="passportNumber" placeholder="P1234567" defaultValue={profilePassportNumber} />
                          <LockKeyhole />
                        </div>
                      </Field>
                      <Field label={tx('Official Recruitment Fee', 'رسوم الاستقدام النظامية')}>
                        <div className="locked-input">
                          <input
                            value={currentFee ? `${currentFee.toLocaleString()} SAR` : (profileNationality ? '14,500 SAR' : tx('Select nationality first', 'حدد الجنسية أولاً'))}
                            readOnly
                          />
                          <Coins style={{ color: 'var(--brand-teal)' }} />
                        </div>
                      </Field>
                    </div>

                    <div className="choice-columns" style={{ marginTop: '16px' }}>
                      <ChoiceGroup
                        name="religion"
                        label={tx('Religion', 'الديانة')}
                        options={['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other']}
                        defaultValue={profileReligion || 'Islam'}
                      />
                      <div className="marital-status-col" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <ChoiceGroup
                          name="maritalStatus"
                          label={tx('Marital Status', 'الحالة الاجتماعية')}
                          options={['Single', 'Married', 'Divorced', 'Widowed']}
                          defaultValue={maritalStatus || 'Single'}
                          onChange={setMaritalStatus}
                        />
                        <div style={{ marginTop: '2px' }}>
                          <Field label={tx('Number of Children', 'عدد الأطفال')}>
                            <input
                              name="children"
                              type="number"
                              min="0"
                              value={maritalStatus === 'Single' ? '0' : profileChildren}
                              onChange={(e) => setProfileChildren(e.target.value)}
                              disabled={maritalStatus === 'Single'}
                              placeholder={maritalStatus === 'Single' ? tx('Available for married only', 'متاح للمتزوجين فقط') : '0'}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="form-section">
                    <SectionTitle label="C." title={tx('Professional & Experience Details', 'المهنة والخبرات الوظيفية')} />
                    <div className="fields-grid three">
                      <Field label={tx('Job Title *', 'المسمى الوظيفي *')}>
                        <Select
                          required
                          name="jobTitle"
                          options={isArabic ? ['عاملة منزلية', 'سائق', 'مدبرة منزل', 'عاملة رعاية أطفال', 'طباخ', 'رعاية كبار السن'] : jobTitleOptions}
                          defaultValue={profileJob || (isArabic ? 'عاملة منزلية' : 'Domestic Worker')}
                        />
                      </Field>
                      <Field label={tx('Monthly Salary (SAR)', 'الراتب الشهري (ريال)')}>
                        <input name="salary" type="number" min="0" defaultValue={profileSalary || '1500'} placeholder="1500" />
                      </Field>
                      <Field label={tx('Status / Availability', 'حالة التوفر')}>
                        <Select
                          name="availability"
                          options={isArabic ? ['متاح', 'قيد الإجراء', 'تم التوظيف'] : ['Available', 'In process', 'Placed']}
                          defaultValue={profileAvailability || (isArabic ? 'متاح' : 'Available')}
                        />
                      </Field>
                    </div>

                    {/* Experience Toggle Buttons (Pill-style matching Religion and Marital Status) */}
                    <div style={{ marginTop: '16px' }}>
                      <fieldset className="choice-group">
                        <legend>{tx('Experience Level', 'مستوى الخبرة')}</legend>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={!hasExperience ? 'chosen' : ''}
                            onClick={() => {
                              setHasExperience(false)
                              setExperience('0')
                              setExperienceCountry('')
                              setExperienceCountryOther('')
                            }}
                          >
                            {tx('No Experience', 'بدون خبرة')}
                          </button>
                          <button
                            type="button"
                            className={hasExperience ? 'chosen' : ''}
                            onClick={() => {
                              setHasExperience(true)
                              if (experience === '0' || !experience) setExperience('2')
                              if (!experienceCountry) setExperienceCountry('Saudi Arabia')
                            }}
                          >
                            {tx('Has Experience', 'لديه خبرة')}
                          </button>
                        </div>
                      </fieldset>
                    </div>

                    {/* Conditional Experience Details: Revealed when "Has Experience" is selected */}
                    {hasExperience ? (
                      <div
                        className="experience-conditional-card"
                        style={{
                          marginTop: '14px',
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'linear-gradient(180deg, #f8fbfd 0%, #f0f6fa 100%)',
                          border: '1px solid #d5e2eb',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        <div style={{ maxWidth: '240px' }}>
                          <Field label={tx('Years of Experience', 'سنوات الخبرة')}>
                            <div className="quick-number">
                              <input
                                name="experience"
                                type="number"
                                min="1"
                                max="35"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                placeholder="2"
                              />
                              <button
                                type="button"
                                aria-label={tx('Add one year', 'إضافة سنة')}
                                onClick={() => setExperience((v) => String(Number(v || 0) + 1))}
                              >
                                <Plus />
                              </button>
                            </div>
                          </Field>
                        </div>

                        <fieldset className="choice-group">
                          <legend>{tx('Country of Experience', 'بلد الخبرة')}</legend>
                          <input type="hidden" name="experienceCountry" value={experienceCountry === 'Other' ? (experienceCountryOther || 'Other') : experienceCountry} />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {experienceCountryOptions.map((country) => (
                              <button
                                key={country.en}
                                type="button"
                                className={experienceCountry === country.en ? 'chosen' : ''}
                                onClick={() => setExperienceCountry(country.en)}
                              >
                                {isArabic ? country.ar : country.en}
                              </button>
                            ))}
                          </div>
                        </fieldset>

                        {experienceCountry === 'Other' && (
                          <div style={{ maxWidth: '320px' }}>
                            <Field label={tx('Specify Country', 'حدد الدولة')}>
                              <input
                                name="experienceCountryOther"
                                value={experienceCountryOther}
                                onChange={(e) => setExperienceCountryOther(e.target.value)}
                                placeholder={tx('Enter country name...', 'أدخل اسم الدولة...')}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input type="hidden" name="experience" value="0" />
                    )}
                  </section>

                  <section className="form-section">
                    <SectionTitle label="D." title={tx('Skills & Specializations', 'المهارات والكفاءات')} />
                    <div className="skill-grid">
                      {skillOptions.map((skill) => (
                        <button
                          type="button"
                          key={skill}
                          className={`skill-choice ${skills.includes(skill) ? 'active' : ''}`}
                          onClick={() => setSkills((items) => items.includes(skill) ? items.filter((s) => s !== skill) : [...items, skill])}
                        >
                          <strong>{isArabic ? ({ Cooking: 'الطبخ', Childcare: 'رعاية الأطفال', 'Elderly care': 'رعاية كبار السن', 'Cleaning & organization': 'التنظيف والتنظيم' } as Record<string, string>)[skill] : skill}</strong>
                          <span>{skills.includes(skill) ? tx('✓ Verified', '✓ معتمد') : tx('Not selected', 'غير محدد')}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="form-section">
                    <SectionTitle label="E." title={tx('Physical Specifications', 'المواصفات الجسدية')} />
                    <div className="fields-grid three">
                      <Field label={tx('Height (cm)', 'الطول (سم)')}>
                        <input name="height" type="number" min="100" max="220" defaultValue={profileHeight} placeholder="160" />
                      </Field>
                      <Field label={tx('Weight (kg)', 'الوزن (كجم)')}>
                        <input name="weight" type="number" min="30" max="150" defaultValue={profileWeight} placeholder="55" />
                      </Field>
                    </div>
                  </section>

                  <div className="form-footer">
                    <span>{tx('All verified candidates will be instantly viewable in Musaned portal.', 'سيظهر ملف المرشح المعتمد فوراً في منصة مساند وبوابة الكفلاء.')}</span>
                    <button className="approve-button" type="submit">
                      <Check /> {editingWorkerId ? tx('Save Changes', 'حفظ التعديلات') : tx('Publish Profile', 'اعتماد ونشر الملف')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteTarget && (
          <DeleteConfirm
            worker={deleteTarget}
            language={language}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDeleteWorkerConfirm}
          />
        )}
      </main>

      {/* Floating System Toast */}
      {saved && (
        <div className="saved-toast">
          <CheckCircle2 /> {toastMessage || tx('Changes saved successfully', 'تم حفظ التعديلات بنجاح')}
        </div>
      )}

      {/* CV PDF Preview Modal */}
      {published && (
        <CVPreview
          language={language}
          name={profileName}
          job={profileJob}
          nationality={profileNationality}
          age={profileAge}
          experience={profileExperience}
          experienceCountry={hasExperience ? (experienceCountry === 'Other' ? (experienceCountryOther || 'Other') : experienceCountry) : ''}
          religion={profileReligion}
          maritalStatus={profileMaritalStatus}
          children={profileChildren}
          salary={profileSalary}
          fee={String(currentFee || '14500')}
          weight={profileWeight}
          height={profileHeight}
          skills={profileSkills}
          portrait={portrait}
          gender={profileGender}
          availability={profileAvailability}
          passportNumber={profilePassportNumber}
          onClose={() => setPublished(false)}
        />
      )}
    </div>
  )
}

/* ========================================================================= */
/* SPONSOR PORTAL (EXACT PHOTO MATCH - 4 CARDS, 4 FILTERS, NO SIDEBAR)       */
/* ========================================================================= */

const SponsorPortal = memo(function SponsorPortal({
  workers, loading, language, userEmail, onLanguageChange, onOpenWorker, onLogout, loggingOut,
  published, profileName, profileJob, profileNationality, profileAge, profileExperience,
  profileReligion, profileMaritalStatus, profileChildren, profileSalary, currentFee,
  profileWeight, profileHeight, profileSkills, portrait, profileGender, profileAvailability, profilePassportNumber, onCloseCV
}: {
  workers: Worker[]
  loading?: boolean
  language: 'en' | 'ar'
  userEmail: string
  onLanguageChange: (lang: 'en' | 'ar') => void
  onOpenWorker: (w: Worker) => void
  onLogout?: () => void
  loggingOut?: boolean
  published: boolean
  profileName: string
  profileJob: string
  profileNationality: string
  profileAge: string
  profileExperience: string
  profileReligion: string
  profileMaritalStatus: string
  profileChildren: string
  profileSalary: string
  currentFee: number
  profileWeight: string
  profileHeight: string
  profileSkills: string[]
  portrait: string
  profileGender?: string
  profileAvailability?: string
  profilePassportNumber?: string
  onCloseCV: () => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])

  const [nationality, setNationality] = useState('All')
  const [ageRange, setAgeRange] = useState('All')
  const [religion, setReligion] = useState('All')
  const [experience, setExperience] = useState('All')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [orderedCandidate, setOrderedCandidate] = useState<Worker | null>(null)

  const resetFilters = useCallback(() => {
    setNationality('All')
    setAgeRange('All')
    setReligion('All')
    setExperience('All')
  }, [])

  // Filter only Available workers for sponsors
  const availableWorkers = useMemo(() => workers.filter((w) => w.status === 'Available' || w.status === 'متاح'), [workers])

  // Extract distinct nationalities and religions from available workers
  const nationalities = useMemo(() => [
    ...new Set([
      'The Philippines', 'Indonesia', 'Kenya', 'Ethiopia', 'Sri Lanka', 'Uganda', 'India', 'Bangladesh',
      ...availableWorkers.map((w) => w.country).filter(Boolean)
    ])
  ], [availableWorkers])

  const religions = useMemo(() => [
    ...new Set([
      'Islam', 'Christianity', 'Buddhism', 'Hinduism', 'Other',
      ...availableWorkers.map((w) => w.religion).filter(Boolean)
    ])
  ], [availableWorkers])

  const filteredWorkers = useMemo(() => {
    return availableWorkers.filter((worker) => {
      // Nationality match
      const matchNat = nationality === 'All' || worker.country.toLowerCase() === nationality.toLowerCase()

      // Age range match: '20-30', '31-40', '41-50', '51-60'
      const workerAge = Number(worker.age) || 0
      let matchAge = true
      if (ageRange === '20-30') matchAge = workerAge >= 20 && workerAge <= 30
      else if (ageRange === '31-40') matchAge = workerAge >= 31 && workerAge <= 40
      else if (ageRange === '41-50') matchAge = workerAge >= 41 && workerAge <= 50
      else if (ageRange === '51-60') matchAge = workerAge >= 51 && workerAge <= 60

      // Religion match
      const matchRel = religion === 'All' || worker.religion.toLowerCase() === religion.toLowerCase()

      // Experience match
      const expYears = Number(worker.experience) || 0
      let matchExp = true
      if (experience === 'With experience') matchExp = expYears > 0
      else if (experience === 'No experience') matchExp = expYears === 0

      return matchNat && matchAge && matchRel && matchExp
    })
  }, [availableWorkers, nationality, ageRange, religion, experience])

  // INSTANT OPTIMISTIC ORDER: Opens dialog immediately (0ms delay), submits request in background
  const handleOrder = useCallback((worker: Worker) => {
    setOrderedCandidate(worker)
    ;(async () => {
      try {
        await neonClient
          .from('worker_requests')
          .insert({
            worker_id: worker.id,
            sponsor_email: userEmail
          })
      } catch (err) {
        console.warn('Background worker request error:', err)
      }
    })()
  }, [userEmail])

  return (
    <div className={`sponsor-portal-shell ${isArabic ? 'rtl-mode' : ''}`} dir={isArabic ? 'rtl' : 'ltr'} lang={language}>
      {/* Clean top bar for sponsor */}
      <header className="sponsor-top-header">
        <div className="sponsor-brand">
          <img src={logoUrl} alt="Fan AlFaisal Recruitment Company" />
          <div>
            <strong>Fan Al Faisal</strong>
            <span>{isArabic ? 'شركة فن الفيصل للاستقدام' : 'Recruitment Company'}</span>
          </div>
        </div>

        <div className="sponsor-header-actions">
          <button
            type="button"
            className="header-lang-btn"
            onClick={() => onLanguageChange(isArabic ? 'en' : 'ar')}
            title={t('Switch language', 'تغيير اللغة')}
          >
            <Globe />
            <span>{isArabic ? 'English' : 'العربية'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#f1f5f8', borderRadius: 999 }}>
            <span className="profile-trigger-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
              {userEmail.slice(0, 2).toUpperCase() || 'SP'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-navy)' }}>
              {userEmail.split('@')[0] || t('Sponsor Account', 'حساب الكفيل')}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            style={{ width: 'auto', padding: '7px 12px', margin: 0 }}
            disabled={loggingOut}
            onClick={onLogout}
          >
            <LogOut className={loggingOut ? 'animate-spin' : ''} />
            {loggingOut ? t('Logging out…', 'جارٍ الخروج…') : t('Log out', 'تسجيل الخروج')}
          </button>
        </div>
      </header>

      {/* Main Body exactly like the photo */}
      <main className="sponsor-main-body">
        {/* Filter Card */}
        <section className="sponsor-filter-box">
          <div className="sponsor-filter-row">
            {/* Nationality */}
            <label className="sponsor-filter-field">
              <span>{t('NATIONALITY', 'الجنسية')}</span>
              <div className="sponsor-select-wrapper">
                <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                  <option value="All">{t('All nationalities', 'جميع الجنسيات')}</option>
                  {nationalities.map((c) => (
                    <option key={c} value={c}>
                      {isArabic ? (nationalityMap[c]?.ar || c) : c}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>

            {/* Age Range */}
            <label className="sponsor-filter-field">
              <span>{t('AGE RANGE', 'الفئة العمرية')}</span>
              <div className="sponsor-select-wrapper">
                <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                  <option value="All">{t('All ages', 'جميع الأعمار')}</option>
                  <option value="20-30">20–30</option>
                  <option value="31-40">31–40</option>
                  <option value="41-50">41–50</option>
                  <option value="51-60">51–60</option>
                </select>
                <ChevronDown />
              </div>
            </label>

            {/* Religion */}
            <label className="sponsor-filter-field">
              <span>{t('RELIGION', 'الديانة')}</span>
              <div className="sponsor-select-wrapper">
                <select value={religion} onChange={(e) => setReligion(e.target.value)}>
                  <option value="All">{t('All religions', 'جميع الديانات')}</option>
                  {religions.map((r) => (
                    <option key={r} value={r}>
                      {isArabic ? ({ Islam: 'الإسلام', Christianity: 'المسيحية', Buddhism: 'البوذية', Hinduism: 'الهندوسية', Other: 'أخرى' } as Record<string, string>)[r] || r : r}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>

            {/* Experience */}
            <label className="sponsor-filter-field">
              <span>{t('EXPERIENCE', 'الخبرة')}</span>
              <div className="sponsor-select-wrapper">
                <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="All">{t('All experience', 'جميع الخبرات')}</option>
                  <option value="With experience">{t('With experience', 'مع خبرة')}</option>
                  <option value="No experience">{t('No experience', 'بدون خبرة')}</option>
                </select>
                <ChevronDown />
              </div>
            </label>

            {/* Filters Button */}
            <button
              type="button"
              className={`sponsor-filters-btn ${showAdvanced ? 'active' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {t('Filters', 'تصفية')}
            </button>
          </div>

          {/* Reset Button on second line */}
          <button
            type="button"
            className="sponsor-reset-btn"
            onClick={resetFilters}
            aria-label={t('Reset filters', 'إعادة ضبط')}
            title={t('Reset filters', 'إعادة ضبط')}
          >
            <RotateCcw />
          </button>
        </section>

        {/* Total Workers Badge */}
        <div>
          <span className="sponsor-total-badge">
            {t(`Total Workers: ${filteredWorkers.length}`, `إجمالي العمال: ${filteredWorkers.length}`)}
          </span>
        </div>

        {/* 4-column card grid */}
        <div className="sponsor-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-avatar skeleton-shimmer" />
                <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }} />
                <div className="skeleton-line skeleton-shimmer" style={{ width: '40%' }} />
                <div className="skeleton-grid-facts">
                  <div className="skeleton-fact skeleton-shimmer" />
                  <div className="skeleton-fact skeleton-shimmer" />
                  <div className="skeleton-fact skeleton-shimmer" />
                  <div className="skeleton-fact skeleton-shimmer" />
                </div>
              </div>
            ))
          ) : (
            filteredWorkers.map((worker) => {
              const countryLabel = isArabic ? (nationalityMap[worker.country]?.ar || worker.country) : worker.country
              const initials = worker.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || 'WD'

              return (
                <article key={worker.id} className="sponsor-candidate-card">
                  {/* Top row */}
                  <div className="sponsor-card-top-bar">
                    <span className="sponsor-country-pill">
                      <span className="sponsor-country-dot">•</span>
                      <span>{countryLabel || 'Global'}</span>
                    </span>

                    <div className="sponsor-availability-indicator">
                      <span className="sponsor-toggle-pill" />
                      <span className="sponsor-availability-text">{t('Available', 'متاح')}</span>
                    </div>
                  </div>

                  {/* Avatar / Photo */}
                  <div className="sponsor-card-avatar-wrap">
                    {worker.passportPhoto || worker.portrait ? (
                      <img
                        className="sponsor-card-photo"
                        src={worker.passportPhoto || worker.portrait}
                        alt={worker.name}
                      />
                    ) : (
                      <div className="sponsor-card-initials">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Name & Role */}
                  <h3 className="sponsor-card-name">{worker.name}</h3>
                  <p className="sponsor-card-role">{worker.role}</p>

                  {/* 2x2 Facts */}
                  <div className="sponsor-facts-grid">
                    <div className="sponsor-fact-box">
                      <span className="sponsor-fact-label">{t('EXPERIENCE', 'الخبرة')}</span>
                      <strong className="sponsor-fact-val">{worker.experience || '0'} {t('Years', 'سنوات')}</strong>
                    </div>
                    <div className="sponsor-fact-box">
                      <span className="sponsor-fact-label">{t('RELIGION', 'الديانة')}</span>
                      <strong className="sponsor-fact-val">{worker.religion || '—'}</strong>
                    </div>
                    <div className="sponsor-fact-box">
                      <span className="sponsor-fact-label">{t('PASSPORT', 'الجواز')}</span>
                      <strong className="sponsor-fact-val">{worker.passport || '—'}</strong>
                    </div>
                    <div className="sponsor-fact-box">
                      <span className="sponsor-fact-label">{t('FEES', 'الرسوم')}</span>
                      <strong className="sponsor-fact-val">{worker.fee ? `${worker.fee.toLocaleString()} SAR` : '14,500 SAR'}</strong>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="sponsor-card-footer">
                    <button
                      type="button"
                      className="sponsor-view-profile"
                      onClick={() => onOpenWorker(worker)}
                    >
                      <Eye />
                      <span>{t('View profile', 'عرض الملف')}</span>
                    </button>

                    <button
                      type="button"
                      className="sponsor-order-btn"
                      onClick={() => handleOrder(worker)}
                    >
                      {t('Order now', 'طلب استقدام')}
                    </button>
                  </div>
                </article>
              )
            })
          )}

          {!loading && filteredWorkers.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-state-icon"><Users /></div>
              <h3>{t('No Candidates Match Your Filters', 'لا يوجد مرشحون يطابقون خيارات التصفية')}</h3>
              <p>{t('Try selecting another nationality, age group, or clearing your active filters.', 'يرجى تجربة اختيار جنسية أخرى أو فئة عمرية مختلفة، أو إعادة ضبط الفلاتر.')}</p>
              <button className="empty-state-btn" onClick={resetFilters}>
                <RotateCcw style={{ width: 14, height: 14 }} />
                <span>{t('Reset Filters', 'إعادة ضبط التصفية')}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Order Confirmation Success Dialog */}
      {orderedCandidate && (
        <div className="worker-modal" role="dialog" aria-modal="true">
          <div className="order-success-dialog">
            <div className="order-success-icon">
              <Check />
            </div>
            <h2>{t('Recruitment Request Received!', 'تم استلام طلب الاستقدام بنجاح!')}</h2>
            <p>
              {t(
                'Your application has been registered in the Fan AlFaisal recruitment queue. Our team is preparing the Musaned contract.',
                'تم تسجيل طلبكم رسمياً في نظام شركة فن الفيصل للاستقدام، وسيقوم فريقنا بإعداد العقد عبر مساند.'
              )}
            </p>

            <div className="order-details-box">
              <div className="order-detail-line">
                <span>{t('Candidate Name', 'اسم المرشح')}</span>
                <strong>{orderedCandidate.name}</strong>
              </div>
              <div className="order-detail-line">
                <span>{t('Job Title', 'المهنة')}</span>
                <strong>{orderedCandidate.role}</strong>
              </div>
              <div className="order-detail-line">
                <span>{t('Nationality', 'الجنسية')}</span>
                <strong>{isArabic ? (nationalityMap[orderedCandidate.country]?.ar || orderedCandidate.country) : orderedCandidate.country}</strong>
              </div>
              <div className="order-detail-line">
                <span>{t('Official Fee', 'الرسوم النظامية')}</span>
                <strong style={{ color: 'var(--brand-teal)' }}>{orderedCandidate.fee ? `${orderedCandidate.fee.toLocaleString()} SAR` : '14,500 SAR'}</strong>
              </div>
              <div className="order-detail-line">
                <span>{t('Request Reference', 'رقم المرجع')}</span>
                <strong style={{ fontFamily: 'monospace' }}>#FA-{Math.floor(100000 + Math.random() * 900000)}</strong>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--brand-teal)', background: '#f0f9f7', padding: '10px 14px', borderRadius: 10, width: '100%', textAlign: 'center', fontWeight: 600 }}>
              {t('A customer service agent will contact you within 15 minutes.', 'سيتواصل معكم أخصائي خدمة العملاء خلال ١٥ دقيقة.')}
            </div>

            <button
              className="approve-button"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setOrderedCandidate(null)}
            >
              {t('Done / Return to Directory', 'تم / العودة لقائمة المرشحين')}
            </button>
          </div>
        </div>
      )}

      {/* CV Modal for Sponsor */}
      {published && (
        <CVPreview
          language={language}
          name={profileName}
          job={profileJob}
          nationality={profileNationality}
          age={profileAge}
          experience={profileExperience}
          experienceCountry={hasExperience ? (experienceCountry === 'Other' ? (experienceCountryOther || 'Other') : experienceCountry) : ''}
          religion={profileReligion}
          maritalStatus={profileMaritalStatus}
          children={profileChildren}
          salary={profileSalary}
          fee={String(currentFee || '14500')}
          weight={profileWeight}
          height={profileHeight}
          skills={profileSkills}
          portrait={portrait}
          gender={profileGender}
          availability={profileAvailability}
          passportNumber={profilePassportNumber}
          onClose={onCloseCV}
        />
      )}
    </div>
  )
})

/* ========================================================================= */
/* 1. ADMIN DASHBOARD OVERVIEW                                               */
/* ========================================================================= */

const AdminDashboardOverview = memo(function AdminDashboardOverview({
  role, workers, feeRows, language, userEmail, onAddWorker, onOpenWorker, onEditWorker, onDeleteWorker, onToggleAvailability, onNavigate
}: {
  role: string
  workers: Worker[]
  feeRows: FeeRow[]
  language: 'en' | 'ar'
  userEmail: string
  onAddWorker: () => void
  onOpenWorker: (w: Worker) => void
  onEditWorker: (w: Worker) => void
  onDeleteWorker: (w: Worker) => void | Promise<void>
  onToggleAvailability: (w: Worker) => void | Promise<void>
  onNavigate: (view: string, filter?: string) => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])

  const { total, availableCount, inProcessCount, placedCount, availablePercent } = useMemo(() => {
    const total = workers.length
    let availableCount = 0
    let inProcessCount = 0
    let placedCount = 0
    for (let i = 0; i < total; i++) {
      const s = workers[i].status
      if (s === 'Available' || s === 'متاح') availableCount++
      else if (s === 'In process' || s === 'قيد الإجراء') inProcessCount++
      else if (s === 'Placed' || s === 'تم التوظيف') placedCount++
    }
    const availablePercent = total ? Math.round((availableCount / total) * 100) : 0
    return { total, availableCount, inProcessCount, placedCount, availablePercent }
  }, [workers])

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (let i = 0; i < workers.length; i++) {
      const c = workers[i].country || 'Other'
      counts[c] = (counts[c] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [workers])

  const avgFee = useMemo(() => {
    if (!feeRows.length) return 14500
    let sum = 0
    for (let i = 0; i < feeRows.length; i++) {
      sum += (feeRows[i].fee_sar || 0)
    }
    return Math.round(sum / feeRows.length)
  }, [feeRows])

  const professions = useMemo(() => [
    { titleEn: 'Domestic Worker', titleAr: 'عاملة منزلية', icon: <Sparkles />, count: workers.filter((w) => w.role.toLowerCase().includes('domestic') || w.role.toLowerCase().includes('منزلية')).length },
    { titleEn: 'Private Driver', titleAr: 'سائق خاص', icon: <Briefcase />, count: workers.filter((w) => w.role.toLowerCase().includes('driver') || w.role.toLowerCase().includes('سائق')).length },
    { titleEn: 'Childcare Specialist', titleAr: 'رعاية أطفال', icon: <HeartIcon />, count: workers.filter((w) => w.role.toLowerCase().includes('child') || w.role.toLowerCase().includes('أطفال')).length },
    { titleEn: 'Home Cook', titleAr: 'طباخ منزلي', icon: <Award />, count: workers.filter((w) => w.role.toLowerCase().includes('cook') || w.role.toLowerCase().includes('طباخ')).length },
    { titleEn: 'Elderly Caregiver', titleAr: 'رعاية كبار السن', icon: <UserCheck />, count: workers.filter((w) => w.role.toLowerCase().includes('elder') || w.role.toLowerCase().includes('مسن')).length },
  ], [workers])

  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('Good morning', 'صباح الخير')
    : hour < 17
    ? t('Good afternoon', 'طاب مساؤكم')
    : t('Good evening', 'مساء الخير')

  const username = userEmail.split('@')[0] || t('Director', 'سعادة المدير')

  return (
    <div className="dashboard-container">
      {/* Hero Command Banner */}
      <section className="admin-hero-card">
        <div className="admin-hero-content">
          <div className="hero-kicker-wrap">
            <span className="hero-kicker">FAN ALFAISAL / OPERATIONS HUB</span>
            <span className="hero-status-pill">
              <span className="live-pulse" />
              {t('Musaned Certified Gateway', 'بوابة مساند المعتمدة')}
            </span>
          </div>
          <h1 className="hero-title">{greeting}, {username}</h1>
          <p className="hero-subtitle">
            {t(
              'Real-time overview of candidate pipeline, sponsor requests, and deployment velocity for Fan AlFaisal Recruitment Company.',
              'لوحة تحكم تنفيذية شاملة لمتابعة مسار استقدام العمالة المنزلية، طلبات الكفلاء، والجاهزية الفورية عبر مساند.'
            )}
          </p>
          <div className="hero-ribbon">
            <span className="hero-ribbon-item">
              <Calendar />
              {new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
            <span className="hero-ribbon-item">
              <Activity />
              {t('System Health: 100% Operational', 'حالة الربط التقني: ١٠٠٪ نشط')}
            </span>
            <span className="hero-ribbon-item">
              <Globe />
              {t('19 Partner Source Countries', '١٩ دولة استقدام معتمدة')}
            </span>
          </div>
        </div>

        <div className="hero-actions">
          <div className="hero-orbit-badge">
            <strong>FA</strong>
            <small>{t('Verified', 'معتمد')}</small>
          </div>
          <div className="hero-btn-group">
            <button className="hero-btn-primary" onClick={onAddWorker}>
              <Plus />
              <span>{t('Add Candidate', 'إضافة مرشح')}</span>
            </button>
            <button className="hero-btn-secondary" onClick={() => onNavigate('Workers')}>
              <Users />
              <span>{t('All Workers', 'جميع السير')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5 Executive KPI Cards */}
      <section className="admin-kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--brand-teal)' } as React.CSSProperties}>
          <div className="kpi-top">
            <div className="kpi-label-wrap">
              <span className="kpi-label">{t('Total Database', 'إجمالي السير')}</span>
            </div>
            <div className="kpi-icon-wrap teal"><Users /></div>
          </div>
          <div className="kpi-bottom">
            <div className="kpi-value-row">
              <span className="kpi-value">{total}</span>
              <span className="kpi-trend-pill">↗ +14%</span>
            </div>
            <span className="kpi-footnote">{t('Active registered profiles', 'ملفات مسجلة في قاعدة البيانات')}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#10b981' } as React.CSSProperties}>
          <div className="kpi-top">
            <div className="kpi-label-wrap">
              <span className="kpi-label">{t('Immediate Placement', 'جاهز للتعاقد الفوري')}</span>
            </div>
            <div className="kpi-icon-wrap emerald"><UserCheck /></div>
          </div>
          <div className="kpi-bottom">
            <div className="kpi-value-row">
              <span className="kpi-value">{availableCount}</span>
              <span className="kpi-trend-pill" style={{ background: '#dcfce7', color: '#15803d' }}>
                {availablePercent}%
              </span>
            </div>
            <span className="kpi-footnote">{t('Verified & ready for contract', 'متاح للاختيار والحجز عبر مساند')}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}>
          <div className="kpi-top">
            <div className="kpi-label-wrap">
              <span className="kpi-label">{t('In Process & Reserved', 'قيد الإجراء والتعاقد')}</span>
            </div>
            <div className="kpi-icon-wrap amber"><Clock /></div>
          </div>
          <div className="kpi-bottom">
            <div className="kpi-value-row">
              <span className="kpi-value">{inProcessCount + placedCount || 2}</span>
              <span className="kpi-trend-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                {t('Active', 'جارٍ')}
              </span>
            </div>
            <span className="kpi-footnote">{t('Visa issued or in clearance', 'إصدار التأشيرة والتخليص')}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
          <div className="kpi-top">
            <div className="kpi-label-wrap">
              <span className="kpi-label">{t('Source Hubs', 'الدول المصدرة')}</span>
            </div>
            <div className="kpi-icon-wrap blue"><Globe /></div>
          </div>
          <div className="kpi-bottom">
            <div className="kpi-value-row">
              <span className="kpi-value">{countryCounts.length || 19}</span>
              <span className="kpi-trend-pill" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                {t('Licensed', 'مرخصة')}
              </span>
            </div>
            <span className="kpi-footnote">{t('Direct embassy accredited', 'معتمدة لدى السفارات')}</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#8b5cf6' } as React.CSSProperties}>
          <div className="kpi-top">
            <div className="kpi-label-wrap">
              <span className="kpi-label">{t('Standard Fee SAR', 'متوسط الرسوم')}</span>
            </div>
            <div className="kpi-icon-wrap purple"><Coins /></div>
          </div>
          <div className="kpi-bottom">
            <div className="kpi-value-row">
              <span className="kpi-value">{avgFee.toLocaleString()}</span>
              <span className="kpi-unit">SAR</span>
            </div>
            <span className="kpi-footnote">{t('Musaned regulated pricing', 'تسعيرة مساند الرسمية')}</span>
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid */}
      <section className="admin-analytics-grid">
        {/* Card 1: Donut Availability */}
        <div className="analytics-card">
          <div className="analytics-heading">
            <div className="analytics-heading-text">
              <span>{t('PIPELINE VELOCITY', 'مؤشر الجاهزية')}</span>
              <h2>{t('Candidate Availability Ratio', 'نسبة توفر العمالة الجاهزة')}</h2>
            </div>
            <span className="analytics-badge">{availablePercent}% {t('Ready', 'جاهز')}</span>
          </div>

          <div className="pipeline-visual-wrap">
            <div className="donut-chart-container">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="transparent"
                  stroke="var(--brand-teal)" strokeWidth="12"
                  strokeDasharray={`${availablePercent * 2.51} 251.2`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center-copy">
                <strong>{availablePercent}%</strong>
                <small>{t('Available', 'متاح')}</small>
              </div>
            </div>

            <div className="pipeline-legend-list">
              <div className="pipeline-legend-item" onClick={() => onNavigate('Workers', 'Available')}>
                <div className="pipeline-legend-left">
                  <span className="legend-dot available" />
                  <div className="pipeline-legend-copy">
                    <strong>{t('Available for Contract', 'متاح للتعاقد الفوري')}</strong>
                    <span>{t('Ready to match with sponsor', 'جاهز لاختيار الكفيل')}</span>
                  </div>
                </div>
                <span className="pipeline-legend-count">{availableCount}</span>
              </div>

              <div className="pipeline-legend-item" onClick={() => onNavigate('Workers', 'In process')}>
                <div className="pipeline-legend-left">
                  <span className="legend-dot process" />
                  <div className="pipeline-legend-copy">
                    <strong>{t('Processing / In Visa Clearance', 'قيد الإجراءات والتأشيرة')}</strong>
                    <span>{t('Contract signed, embassy stamp', 'عقد موقع وفحص السفارة')}</span>
                  </div>
                </div>
                <span className="pipeline-legend-count">{inProcessCount || 1}</span>
              </div>

              <div className="pipeline-legend-item" onClick={() => onNavigate('Workers', 'Placed')}>
                <div className="pipeline-legend-left">
                  <span className="legend-dot placed" />
                  <div className="pipeline-legend-copy">
                    <strong>{t('Deployed & Placed', 'تم الاستقدام والوصول')}</strong>
                    <span>{t('Active sponsor assignment', 'في كفالة صاحب العمل')}</span>
                  </div>
                </div>
                <span className="pipeline-legend-count">{placedCount || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Top Nationalities */}
        <div className="analytics-card">
          <div className="analytics-heading">
            <div className="analytics-heading-text">
              <span>{t('SOURCE MARKETS', 'الدول الأكثر طلباً')}</span>
              <h2>{t('Top Sourcing Nationalities', 'توزيع العمالة حسب الجنسيات')}</h2>
            </div>
            <span className="analytics-badge">{countryCounts.length || 6} {t('Active', 'دول نشطة')}</span>
          </div>

          <div className="country-dist-list">
            {((countryCounts.length ? countryCounts.slice(0, 4) : [
              ['The Philippines', 8],
              ['Indonesia', 5],
              ['Kenya', 4],
              ['Ethiopia', 3]
            ]) as Array<[string, number]>).map(([country, count]) => {
              const info = nationalityMap[country]
              const percent = total ? Math.round((Number(count) / total) * 100) : 35
              return (
                <div
                  key={country}
                  className="country-dist-item"
                  onClick={() => onNavigate('Workers', country)}
                >
                  <div className="country-dist-header">
                    <div className="country-dist-name">
                      <span className="country-dist-flag">{info?.flag || '🌐'}</span>
                      <span>{isArabic ? (info?.ar || country) : country}</span>
                    </div>
                    <span className="country-dist-count">{count} {t('candidates', 'مرشح')} ({percent}%)</span>
                  </div>
                  <div className="country-dist-bar-track">
                    <div className="country-dist-bar-fill" style={{ width: `${Math.min(100, Math.max(15, percent))}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Professions Quick Grid */}
      <section className="professions-section">
        <div className="professions-header">
          <strong>{t('Candidate Categories & Job Specializations', 'التخصصات والمهن المتاحة')}</strong>
          <span>{t('Click any category to filter candidates', 'اضغط على أي مهنة للتصفية الفورية')}</span>
        </div>
        <div className="professions-grid">
          {professions.map((prof) => (
            <div
              key={prof.titleEn}
              className="profession-card"
              onClick={() => onNavigate('Workers', prof.titleEn)}
            >
              <div className="profession-icon-wrap">{prof.icon}</div>
              <div>
                <strong>{isArabic ? prof.titleAr : prof.titleEn}</strong>
                <small>{t('Musaned Verified', 'معتمد مهنياً')}</small>
              </div>
              <div className="profession-card-bottom">
                <span className="profession-badge">{prof.count} {t('Candidates', 'سيرة')}</span>
                <span className="profession-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Hub: Recent Candidates & Recent Inquiries */}
      <section className="admin-split-grid">
        {/* Left Column: Recent Candidates */}
        <div className="operational-panel">
          <div className="operational-panel-header">
            <h3>{t('Recent Candidate Profiles', 'أحدث السير الذاتية المضافة')}</h3>
            <button className="operational-link-btn" onClick={() => onNavigate('Workers')}>
              <span>{t('View all candidates', 'عرض جميع العمال')}</span>
              <ArrowRight />
            </button>
          </div>

          <div className="recent-worker-list">
            {workers.slice(0, 4).map((worker) => (
              <div key={worker.id} className="recent-worker-row">
                <div className="recent-worker-person">
                  {worker.passportPhoto || worker.portrait ? (
                    <img className="recent-worker-avatar" src={worker.passportPhoto || worker.portrait} alt={worker.name} />
                  ) : (
                    <div className="recent-worker-avatar-fallback">
                      {worker.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="recent-worker-info">
                    <strong>{worker.name}</strong>
                    <div className="recent-worker-meta">
                      <span className="meta-country-tag">
                        {nationalityMap[worker.country]?.flag || '🌐'} {worker.country}
                      </span>
                      <span>·</span>
                      <span>{worker.role}</span>
                      <span>·</span>
                      <span>{worker.experience || '0'} {t('yrs exp', 'سنوات خبرة')}</span>
                    </div>
                  </div>
                </div>

                <div className="recent-worker-actions">
                  <button
                    type="button"
                    className={`availability-switch ${worker.status === 'Available' || worker.status === 'متاح' ? 'is-available' : 'is-unavailable'}`}
                    onClick={() => onToggleAvailability(worker)}
                    title={t('Toggle availability', 'تغيير حالة التوفر')}
                  >
                    <span />
                    <b>{worker.status === 'Available' || worker.status === 'متاح' ? t('Available', 'متاح') : t('Unavailable', 'غير متاح')}</b>
                  </button>

                  <div className="recent-worker-btns">
                    <button className="recent-worker-btn view" onClick={() => onOpenWorker(worker)} title={t('View CV', 'عرض السيرة')}>
                      <Eye />
                      <span>{t('View', 'السيرة')}</span>
                    </button>
                    <button className="recent-worker-btn edit" onClick={() => onEditWorker(worker)} title={t('Edit Candidate', 'تعديل المرشح')}>
                      <Pencil />
                      <span>{t('Edit', 'تعديل')}</span>
                    </button>
                    <button className="recent-worker-btn del" onClick={() => onDeleteWorker(worker)} title={t('Delete Candidate', 'حذف المرشح')}>
                      <Trash2 />
                      <span>{t('Delete', 'حذف')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {workers.length === 0 && (
              <p style={{ textAlign: 'center', color: '#8fa1b2', padding: '24px 0' }}>
                {t('No candidates added yet. Click "+ Add Candidate" above.', 'لم تتم إضافة مرشحين بعد. اضغط "+ إضافة مرشح" بالأعلى.')}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Recent Inquiries */}
        <div className="operational-panel">
          <div className="operational-panel-header">
            <h3>{t('Recent Sponsor Inquiries', 'أحدث طلبات الكفلاء')}</h3>
            <button className="operational-link-btn" onClick={() => onNavigate('Inquiries')}>
              <span>{t('View all requests', 'عرض جميع الطلبات')}</span>
              <ArrowRight />
            </button>
          </div>

          <div className="recent-inquiry-list">
            {initialInquiries.map((inq) => (
              <div key={inq.id} className="recent-inquiry-row">
                <div className="inquiry-row-top">
                  <span className="inquiry-sponsor-name">{inq.sponsorName}</span>
                  <span className={`inquiry-status-pill ${inq.status === 'New' ? 'new' : inq.status === 'In Process' ? 'process' : 'assigned'}`}>
                    {isArabic ? (inq.status === 'New' ? 'جديد' : inq.status === 'In Process' ? 'قيد المراجعة' : 'تم التعيين') : inq.status}
                  </span>
                </div>
                <div className="inquiry-row-detail">
                  <span className="inquiry-role-tag">{inq.requestedRole} ({inq.preferredNationality})</span>
                  <span>{inq.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
})

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

/* ========================================================================= */
/* 2. WORKER DIRECTORY (GRID & TABLE WITH SKELETONS & EMPTY STATES)          */
/* ========================================================================= */

const WorkerDirectory = memo(function WorkerDirectory({
  view, role, workers, loading, searchInitial, categoryInitial, feeRows, language,
  onAddWorker, onOpenWorker, onDeleteWorker, onToggleAvailability, onEditWorker
}: {
  view: string
  role: string
  workers: Worker[]
  loading?: boolean
  searchInitial?: string
  categoryInitial?: string
  feeRows: FeeRow[]
  language: 'en' | 'ar'
  onAddWorker: () => void
  onOpenWorker: (w: Worker) => void
  onDeleteWorker: (w: Worker) => void | Promise<void>
  onToggleAvailability: (w: Worker) => void | Promise<void>
  onEditWorker: (w: Worker) => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])
  const [query, setQuery] = useState(searchInitial || '')
  const deferredQuery = useDeferredValue(query)
  const [passport, setPassport] = useState('')
  const deferredPassport = useDeferredValue(passport)
  const [nationality, setNationality] = useState('All')
  const [religion, setReligion] = useState('All')
  const [experience, setExperience] = useState('All')
  const [status, setStatus] = useState(categoryInitial === 'Available' ? 'Available' : 'All')
  const [service, setService] = useState(
    categoryInitial && categoryInitial !== 'Available' && categoryInitial !== 'All' ? categoryInitial : 'All'
  )
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    if (searchInitial !== undefined) setQuery(searchInitial)
  }, [searchInitial])

  useEffect(() => {
    if (categoryInitial) {
      if (categoryInitial === 'Available') {
        setStatus('Available')
      } else if (categoryInitial !== 'All') {
        setService(categoryInitial)
      } else {
        setStatus('All')
        setService('All')
      }
    }
  }, [categoryInitial])

  const reset = useCallback(() => {
    setQuery('')
    setPassport('')
    setNationality('All')
    setService('All')
    setReligion('All')
    setExperience('All')
    setStatus('All')
  }, [])

  const nationalities = useMemo(() => [...new Set(workers.map((w) => w.country).filter(Boolean))], [workers])
  const religions = useMemo(() => [...new Set(workers.map((w) => w.religion).filter(Boolean))], [workers])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const p = deferredPassport.trim().toLowerCase()
    return workers.filter((worker) => {
      const matchQuery = !q || worker.name.toLowerCase().includes(q) || worker.role.toLowerCase().includes(q) || worker.country.toLowerCase().includes(q)
      const matchPassport = !p || worker.passport.toLowerCase().includes(p)
      const matchNationality = nationality === 'All' || worker.country.toLowerCase() === nationality.toLowerCase()
      const matchService = service === 'All' || worker.role.toLowerCase().includes(service.toLowerCase())
      const matchReligion = religion === 'All' || worker.religion.toLowerCase() === religion.toLowerCase()
      const isAvail = worker.status === 'Available' || worker.status === 'متاح'
      const matchStatus = status === 'All' || (status === 'Available' ? isAvail : (!isAvail && status === 'Unavailable')) || worker.status === status
      const matchExp = experience === 'All' || (experience === 'With experience' ? Number(worker.experience) > 0 : Number(worker.experience) === 0)
      return matchQuery && matchPassport && matchNationality && matchService && matchReligion && matchStatus && matchExp
    })
  }, [workers, deferredQuery, deferredPassport, nationality, service, religion, status, experience])

  return (
    <div className="directory-page">
      <div className="directory-toolbar">
        <div>
          <p className="eyebrow">FAN ALFAISAL / RECRUITMENT DATABASE</p>
          <h1>Candidate Directory</h1>
          <p>Browse, filter, and review Musaned-compliant worker profiles.</p>
        </div>
        {role !== 'sponsor' && (
          <button className="directory-add" onClick={onAddWorker}>
            <Plus /> Add Candidate
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <section className="filter-panel">
        <div className="filter-row">
          <label className="filter-field">
            <span>CANDIDATE NAME / ROLE</span>
            <div>
              <Search />
              <input
                placeholder="Search by name, role, country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </label>

          <label className="filter-field">
            <span>PASSPORT / IQAMA</span>
            <div>
              <LockKeyhole />
              <input
                placeholder="Passport number..."
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
              />
            </div>
          </label>

          <label className="filter-field">
            <span>NATIONALITY</span>
            <div>
              <Globe />
              <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                <option value="All">All nationalities</option>
                {nationalities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>

          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal /> Filters
          </button>

          <button className="filter-reset" onClick={reset} aria-label="Reset filters" title="Reset filters">
            <RotateCcw />
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <FilterChips
              label="SPECIALIZATION / SERVICE"
              options={['All', 'Domestic Worker', 'Driver', 'Housekeeper', 'Childcare Worker', 'Cook', 'Elderly Caregiver']}
              value={service}
              onChange={setService}
            />
            <FilterChips
              label="AVAILABILITY STATUS"
              options={['All', 'Available', 'Unavailable', 'In process', 'Placed']}
              value={status}
              onChange={setStatus}
            />
            <FilterChips
              label="RELIGION"
              options={['All', 'Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Other']}
              value={religion}
              onChange={setReligion}
            />
            <FilterChips
              label="EXPERIENCE"
              options={['All', 'With experience', 'No experience']}
              value={experience}
              onChange={setExperience}
            />
          </div>
        )}
      </section>

      {/* Directory Meta */}
      <div className="directory-meta">
        <span className="total-pill">
          <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--brand-teal)' }} />
          Showing {filtered.length} of {workers.length} Candidates
        </span>

        <div className="view-toggle">
          <button
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            ▦ Card Grid
          </button>
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            ▤ Table List
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="worker-card-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-avatar skeleton-shimmer" />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '40%' }} />
              <div className="skeleton-grid-facts">
                <div className="skeleton-fact skeleton-shimmer" />
                <div className="skeleton-fact skeleton-shimmer" />
                <div className="skeleton-fact skeleton-shimmer" />
                <div className="skeleton-fact skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="worker-card-grid">
          {filtered.map((worker) => (
            <article className="directory-worker-card" key={worker.id}>
              <div className="card-top">
                <span className="country-tag">
                  {nationalityMap[worker.country]?.flag || '🌐'} {worker.country || 'Global'}
                </span>
                <button
                  type="button"
                  className={`availability-switch ${worker.status === 'Available' || worker.status === 'متاح' ? 'is-available' : 'is-unavailable'}`}
                  onClick={() => onToggleAvailability(worker)}
                  aria-label={`Toggle ${worker.name}`}
                >
                  <span />
                  <b>{worker.status === 'Available' || worker.status === 'متاح' ? (isArabic ? 'متاح' : 'Available') : (isArabic ? 'غير متاح' : 'Unavailable')}</b>
                </button>
              </div>

              {worker.passportPhoto || worker.portrait ? (
                <img className="card-passport-photo" src={worker.passportPhoto || worker.portrait} alt={worker.name} />
              ) : (
                <div className="card-avatar">
                  {worker.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <h3>{worker.name}</h3>
              <p className="card-role">{worker.role}</p>

              <div className="card-facts">
                <span>
                  <small>EXPERIENCE</small>
                  <strong>{worker.experience || '0'} Years</strong>
                </span>
                <span>
                  <small>RELIGION</small>
                  <strong>{worker.religion || '—'}</strong>
                </span>
                <span>
                  <small>PASSPORT</small>
                  <strong>{worker.passport || 'Verified'}</strong>
                </span>
                <span>
                  <small>FEE SAR</small>
                  <strong>{worker.fee ? `${worker.fee.toLocaleString()} SAR` : '14,500 SAR'}</strong>
                </span>
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="card-action-btn view"
                  onClick={() => onOpenWorker(worker)}
                  title={t('View CV', 'عرض السيرة الذاتية')}
                >
                  <Eye />
                  <span>{t('View', 'عرض')}</span>
                </button>
                <button
                  type="button"
                  className="card-action-btn edit"
                  onClick={() => onEditWorker(worker)}
                  title={t('Edit Candidate Profile', 'تعديل بيانات المرشح')}
                >
                  <Pencil />
                  <span>{t('Edit', 'تعديل')}</span>
                </button>
                <button
                  type="button"
                  className="card-action-btn del"
                  onClick={() => onDeleteWorker(worker)}
                  title={t('Delete Candidate', 'حذف المرشح')}
                >
                  <Trash2 />
                  <span>{t('Delete', 'حذف')}</span>
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-state-icon"><Search /></div>
              <h3>No Candidates Found</h3>
              <p>No candidates match your current search criteria. Try modifying your search term or reset all filters.</p>
              <button className="empty-state-btn" onClick={reset}>
                <RotateCcw style={{ width: 14, height: 14 }} />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="worker-table-wrap">
          <table className="worker-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Specialization</th>
                <th>Nationality</th>
                <th>Religion</th>
                <th>Experience</th>
                <th>Passport</th>
                <th>Official Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker, index) => (
                <tr key={worker.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="table-person">
                      {worker.passportPhoto || worker.portrait ? (
                        <img className="table-passport-photo" src={worker.passportPhoto || worker.portrait} alt={worker.name} />
                      ) : (
                        <div className="recent-worker-avatar-fallback" style={{ width: 34, height: 34, fontSize: 11 }}>
                          {worker.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <strong>{worker.name}</strong>
                    </div>
                  </td>
                  <td>{worker.role}</td>
                  <td>
                    {nationalityMap[worker.country]?.flag || '🌐'} {worker.country}
                  </td>
                  <td>{worker.religion || '—'}</td>
                  <td>{worker.experience || '0'} yrs</td>
                  <td>{worker.passport || '—'}</td>
                  <td style={{ fontWeight: 800, color: 'var(--brand-teal)' }}>
                    {worker.fee ? `${worker.fee.toLocaleString()} SAR` : '14,500 SAR'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`availability-switch ${worker.status === 'Available' || worker.status === 'متاح' ? 'is-available' : 'is-unavailable'}`}
                      onClick={() => onToggleAvailability(worker)}
                    >
                      <span />
                      <b>{worker.status === 'Available' || worker.status === 'متاح' ? (isArabic ? 'متاح' : 'Available') : (isArabic ? 'غير متاح' : 'Unavailable')}</b>
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="view" onClick={() => onOpenWorker(worker)} aria-label="View CV" title={t('View CV', 'عرض السيرة الذاتية')}><Eye /></button>
                      <button className="edit" onClick={() => onEditWorker(worker)} aria-label="Edit candidate" title={t('Edit Candidate', 'تعديل المرشح')}><Pencil /></button>
                      <button className="del" onClick={() => onDeleteWorker(worker)} aria-label="Delete candidate" title={t('Delete Candidate', 'حذف المرشح')}><Trash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 16px', color: '#8fa1b2' }}>
                    No candidates match your current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

/* ========================================================================= */
/* 3. SPONSORS DIRECTORY (INTERACTIVE MODAL & MANAGEMENT)                    */
/* ========================================================================= */

const SponsorsView = memo(function SponsorsView({ language, onShowToast }: { language: 'en' | 'ar'; onShowToast: (msg: string) => void }) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])
  const [sponsors, setSponsors] = useState<SponsorItem[]>(initialSponsors)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const filtered = useMemo(() => sponsors.filter((s) =>
    s.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(deferredQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(deferredQuery.toLowerCase()) ||
    s.phone.includes(deferredQuery)
  ), [sponsors, deferredQuery])

  const handleAddSponsor = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newSp: SponsorItem = {
      id: 'sp-' + Date.now(),
      name: String(form.get('name') || ''),
      contactPerson: String(form.get('contactPerson') || ''),
      phone: String(form.get('phone') || '+966 50 000 0000'),
      city: String(form.get('city') || 'Riyadh'),
      activeRequests: Number(form.get('activeRequests')) || 1,
      totalPlaced: Number(form.get('totalPlaced')) || 0,
      status: (form.get('status') as 'Active' | 'VIP' | 'Pending') || 'Active',
      verified: true
    }
    setSponsors((prev) => [newSp, ...prev])
    setAddModalOpen(false)
    onShowToast(t('Sponsor account created successfully', 'تم إنشاء حساب الكفيل بنجاح'))
  }, [onShowToast, t])

  const handleDeleteSponsor = useCallback((id: string, name: string) => {
    setSponsors((prev) => prev.filter((s) => s.id !== id))
    onShowToast(t(`Sponsor ${name} removed`, `تمت إزالة الكفيل ${name}`))
  }, [onShowToast, t])

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t('Sponsor Accounts & Employers', 'سجل الكفلاء وأصحاب العمل')}</h1>
          <p>{t('Track active household recruitment contracts and sponsor accounts.', 'متابعة عقود استقدام العمالة المنزلية وحسابات الكفلاء النشطة.')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="header-search-wrap" style={{ width: 220 }}>
            <Search />
            <input
              placeholder={t('Search sponsors…', 'بحث عن كفيل…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="directory-add" onClick={() => setAddModalOpen(true)}>
            <Plus /> {t('Add Sponsor Account', 'إضافة حساب كفيل')}
          </button>
        </div>
      </div>

      <div className="sponsors-grid">
        {filtered.map((sp) => (
          <div key={sp.id} className="sponsor-card">
            <div className="sponsor-card-top">
              <div className="sponsor-card-info">
                <h4>{sp.name}</h4>
                <span>{sp.contactPerson} · {sp.city}</span>
              </div>
              <span className={`sponsor-badge ${sp.status.toLowerCase()}`}>
                {sp.status}
              </span>
            </div>

            <div className="sponsor-card-stats">
              <div>
                <small>{t('Active Contracts', 'عقود نشطة')}</small>
                <strong>{sp.activeRequests}</strong>
              </div>
              <div>
                <small>{t('Total Placed', 'إجمالي المستقدمين')}</small>
                <strong>{sp.totalPlaced}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <a href={`tel:${sp.phone}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone style={{ width: 12, height: 12, color: 'var(--brand-teal)' }} />
                <span>{sp.phone}</span>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--brand-teal)', fontWeight: 700 }}>
                  {sp.verified ? t('✓ Verified ID', '✓ هوية معتمدة') : t('Pending', 'قيد المراجعة')}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSponsor(sp.id, sp.name)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                  title={t('Delete sponsor', 'حذف الكفيل')}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-state-icon"><Building2 /></div>
            <h3>{t('No Sponsors Found', 'لم يتم العثور على حسابات كفلاء')}</h3>
            <p>{t('No sponsor accounts match your query.', 'لا توجد حسابات كفلاء تطابق عبارة البحث.')}</p>
            <button className="empty-state-btn" onClick={() => setQuery('')}>
              <RotateCcw style={{ width: 14, height: 14 }} />
              <span>{t('Clear Search', 'مسح البحث')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Sponsor Interactive Modal */}
      {addModalOpen && (
        <div className="worker-modal" role="dialog" aria-modal="true">
          <div className="standard-modal-card">
            <div className="modal-header-row">
              <div>
                <h2>{t('Create Sponsor Account', 'إضافة حساب كفيل جديد')}</h2>
                <p>{t('Register verified household employer credentials.', 'تسجيل بيانات صاحب العمل المعتمد لإصدار التأشيرات.')}</p>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setAddModalOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleAddSponsor} className="modal-form-grid">
              <Field label={t('Family or Company Name *', 'اسم العائلة أو الشركة *')}>
                <input required name="name" placeholder={t('e.g. Al-Sulaiman Household', 'مثال: أسرة السليمان')} />
              </Field>
              <Field label={t('Contact Person Full Name *', 'اسم الشخص المفوض *')}>
                <input required name="contactPerson" placeholder={t('e.g. Abdulaziz Al-Sulaiman', 'مثال: عبدالعزيز السليمان')} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('Mobile Phone *', 'رقم الجوال *')}>
                  <input required name="phone" placeholder="+966 50 123 4567" defaultValue="+966 5" />
                </Field>
                <Field label={t('City / Region *', 'المدينة / المنطقة *')}>
                  <Select
                    name="city"
                    options={isArabic ? ['الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة المنورة', 'القصيم', 'أبها'] : ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina', 'Qassim', 'Abha']}
                    defaultValue={isArabic ? 'الرياض' : 'Riyadh'}
                  />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('Account Tier', 'تصنيف الحساب')}>
                  <Select
                    name="status"
                    options={['VIP', 'Active', 'Pending']}
                    defaultValue="Active"
                  />
                </Field>
                <Field label={t('Initial Active Contracts', 'العقود النشطة')}>
                  <input name="activeRequests" type="number" min="0" defaultValue="1" />
                </Field>
              </div>

              <div className="modal-form-actions">
                <button type="button" className="delete-cancel" onClick={() => setAddModalOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button type="submit" className="approve-button">
                  <Check /> {t('Save Sponsor Account', 'حفظ حساب الكفيل')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

/* ========================================================================= */
/* 4. INQUIRIES & RECRUITMENT REQUESTS (INTERACTIVE ACTION MODAL)            */
/* ========================================================================= */

const InquiriesView = memo(function InquiriesView({
  language, workers, onShowToast
}: {
  language: 'en' | 'ar'
  workers: Worker[]
  onShowToast: (msg: string) => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])
  const [inquiries, setInquiries] = useState<InquiryItem[]>(initialInquiries)
  const [filter, setFilter] = useState('All')
  const [respondingInquiry, setRespondingInquiry] = useState<InquiryItem | null>(null)

  const filtered = useMemo(() => inquiries.filter((inq) =>
    filter === 'All' || inq.status === filter
  ), [inquiries, filter])

  const handleUpdateInquiry = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!respondingInquiry) return
    const form = new FormData(e.currentTarget)
    const newStatus = (form.get('status') as any) || respondingInquiry.status
    const assignedWorker = String(form.get('assignedWorker') || '')
    const notes = String(form.get('notes') || respondingInquiry.notes)

    setInquiries((prev) => prev.map((item) =>
      item.id === respondingInquiry.id
        ? { ...item, status: newStatus, assignedWorkerId: assignedWorker || undefined, notes }
        : item
    ))
    setRespondingInquiry(null)
    onShowToast(t('Inquiry updated successfully', 'تم تحديث الطلب بنجاح'))
  }, [respondingInquiry, onShowToast, t])

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t('Recruitment Inquiries & Requests', 'طلبات الاستقدام والاستفسارات')}</h1>
          <p>{t('Review incoming household worker applications, assign candidates, and contact sponsors.', 'مراجعة طلبات استقدام الأسر والطلبات الجديدة، تعيين المرشحين، والتواصل مع الكفلاء.')}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'New', 'In Process', 'Assigned'].map((s) => (
            <button
              key={s}
              className={`chip-group button ${filter === s ? 'selected' : ''}`}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid #d5e2eb',
                background: filter === s ? 'var(--brand-teal)' : '#fff',
                color: filter === s ? '#fff' : 'inherit', fontWeight: 700, cursor: 'pointer'
              }}
              onClick={() => setFilter(s)}
            >
              {isArabic ? (s === 'All' ? 'الكل' : s === 'New' ? 'جديد' : s === 'In Process' ? 'قيد المراجعة' : 'تم التعيين') : s}
            </button>
          ))}
        </div>
      </div>

      <div className="inquiries-panel">
        <div className="worker-table-wrap">
          <table className="worker-table">
            <thead>
              <tr>
                <th>{t('Sponsor / Household', 'الكفيل / صاحب العمل')}</th>
                <th>{t('Role Requested', 'المهنة المطلوبة')}</th>
                <th>{t('Preferred Nationality', 'الجنسية المفضلة')}</th>
                <th>{t('Contact Phone', 'رقم الاتصال')}</th>
                <th>{t('Received', 'تاريخ الطلب')}</th>
                <th>{t('Status', 'الحالة')}</th>
                <th>{t('Assigned Worker', 'المرشح المعين')}</th>
                <th>{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inq) => {
                const assigned = workers.find((w) => w.id === inq.assignedWorkerId)
                return (
                  <tr key={inq.id}>
                    <td><strong>{inq.sponsorName}</strong></td>
                    <td>{inq.requestedRole}</td>
                    <td>{nationalityMap[inq.preferredNationality]?.flag || '🌐'} {inq.preferredNationality}</td>
                    <td>
                      <a href={`tel:${inq.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {inq.phone}
                      </a>
                    </td>
                    <td>{inq.date}</td>
                    <td>
                      <span className={`inquiry-status-pill ${inq.status === 'New' ? 'new' : inq.status === 'In Process' ? 'process' : 'assigned'}`}>
                        {isArabic ? (inq.status === 'New' ? 'جديد' : inq.status === 'In Process' ? 'قيد المراجعة' : 'تم التعيين') : inq.status}
                      </span>
                    </td>
                    <td>
                      {assigned ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-teal)' }}>
                          ✓ {assigned.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('Unassigned', 'غير محدد')}</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="quick-view-cv-btn"
                        onClick={() => setRespondingInquiry(inq)}
                      >
                        <Phone style={{ width: 12, height: 12 }} />
                        <span>{t('Manage', 'إدارة')}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#8fa1b2' }}>
                    {t('No inquiries in this category.', 'لا توجد طلبات في هذا التصنيف.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Response & Assignment Interactive Modal */}
      {respondingInquiry && (
        <div className="worker-modal" role="dialog" aria-modal="true">
          <div className="standard-modal-card">
            <div className="modal-header-row">
              <div>
                <h2>{t('Manage Recruitment Inquiry', 'إدارة ومتابعة طلب الاستقدام')}</h2>
                <p>{respondingInquiry.sponsorName} · {respondingInquiry.phone}</p>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setRespondingInquiry(null)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleUpdateInquiry} className="modal-form-grid">
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e5edf3', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>{t('Requested Specialization:', 'التخصص المطلوب:')}</span>
                  <strong>{respondingInquiry.requestedRole}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>{t('Preferred Nationality:', 'الجنسية المفضلة:')}</span>
                  <strong>{respondingInquiry.preferredNationality}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <a
                    href={`tel:${respondingInquiry.phone}`}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
                  >
                    <Phone style={{ width: 13, height: 13 }} /> {t('Call Sponsor', 'اتصال هاتفي')}
                  </a>
                  <a
                    href={`https://wa.me/${respondingInquiry.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
                  >
                    <MessageCircle style={{ width: 13, height: 13 }} /> WhatsApp
                  </a>
                </div>
              </div>

              <Field label={t('Inquiry Pipeline Status', 'حالة الطلب في النظام')}>
                <Select
                  name="status"
                  options={['New', 'In Process', 'Assigned', 'Closed']}
                  defaultValue={respondingInquiry.status}
                />
              </Field>

              <Field label={t('Assign Worker Candidate', 'تعيين مرشح مناسب للطلب')}>
                <select
                  name="assignedWorker"
                  defaultValue={respondingInquiry.assignedWorkerId || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d5e2eb' }}
                >
                  <option value="">{t('— Unassigned —', '— غير محدد —')}</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role} - {w.country}) [{w.status}]
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t('Internal Operational Notes', 'ملاحظات فريق العمل')}>
                <textarea
                  name="notes"
                  defaultValue={respondingInquiry.notes}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d5e2eb', fontFamily: 'inherit', fontSize: 13 }}
                  placeholder={t('Enter notes about sponsor preferences, interview schedule, etc.', 'أدخل ملاحظات حول رغبات الكفيل، موعد المقابلة، إلخ.')}
                />
              </Field>

              <div className="modal-form-actions">
                <button type="button" className="delete-cancel" onClick={() => setRespondingInquiry(null)}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button type="submit" className="approve-button">
                  <Check /> {t('Update Inquiry', 'تحديث الطلب')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

/* ========================================================================= */
/* 5. COUNTRY FEES SETTINGS                                                  */
/* ========================================================================= */

const CountryFeesSettings = memo(function CountryFeesSettings({
  feeRows, language, onRefresh, onShowToast
}: {
  feeRows: FeeRow[]
  language: 'en' | 'ar'
  onRefresh: () => Promise<any>
  onShowToast: (msg: string) => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])
  const [draft, setDraft] = useState<FeeRow[]>(feeRows)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [addCountryOpen, setAddCountryOpen] = useState(false)

  useEffect(() => {
    setDraft(feeRows)
  }, [feeRows])

  const filtered = useMemo(() => draft.filter((item) =>
    item.country.toLowerCase().includes(deferredSearch.toLowerCase())
  ), [draft, deferredSearch])

  // OPTIMISTIC UI: Instantly updates local SWR cache and background-syncs
  const handleSave = useCallback(async () => {
    setSaving(true)
    mutate('country_fee_settings', draft, false)
    onShowToast(t('Fee schedule saved successfully.', 'تم حفظ جدول الرسوم بنجاح.'))

    try {
      await Promise.all(
        draft.map((item) =>
          neonClient.from('country_fee_settings').upsert({
            country: item.country,
            fee_sar: item.fee_sar,
            updated_at: new Date().toISOString()
          }, { onConflict: 'country' })
        )
      )
    } catch (err) {
      console.warn('Country fees offline fallback:', err)
    } finally {
      setSaving(false)
      onRefresh()
    }
  }, [draft, mutate, onShowToast, onRefresh, t])

  const handleAddNewCountry = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const country = String(form.get('country') || '').trim()
    const fee = Number(form.get('fee')) || 12000
    if (!country) return

    setDraft((prev) => [...prev, { country, fee_sar: fee }])
    setAddCountryOpen(false)
    onShowToast(t(`Added ${country} to pricing table`, `تمت إضافة ${country} لجدول التسعيرة`))
  }, [onShowToast, t])

  return (
    <div className="settings-page">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">FAN ALFAISAL / COUNTRY PRICING</p>
          <h1>{t('Recruitment Fees by Country', 'رسوم الاستقدام حسب الدولة')}</h1>
          <p>{t('Manage official SAR recruitment pricing synced with Musaned standards.', 'إدارة التسعيرة المعتمدة للعمالة المنزلية بالريال السعودي المتوافقة مع مساند.')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="header-search-wrap" style={{ width: 220 }}>
            <Search />
            <input
              className="header-search-input"
              placeholder={t('Search country...', 'بحث عن دولة...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="directory-add" onClick={() => setAddCountryOpen(true)}>
            <Plus /> {t('Add Country', 'إضافة دولة')}
          </button>
        </div>
      </div>

      <div className="fee-settings-card">
        {filtered.map((item, index) => {
          const nat = nationalityMap[item.country]
          return (
            <div key={item.country} className="fee-country-item">
              <div>
                <span style={{ fontSize: 16, marginRight: 6 }}>{nat?.flag || '🌐'}</span>
                <strong>{isArabic ? (nat?.ar || item.country) : item.country}</strong>
              </div>
              <div className="fee-input-wrap">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={item.fee_sar}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setDraft((prev) =>
                      prev.map((f, i) => i === index ? { ...f, fee_sar: val } : f)
                    )
                  }}
                />
                <b>SAR</b>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8fa1b2', padding: '32px' }}>
            {t('No countries found matching your search.', 'لا توجد دول تطابق عبارة البحث.')}
          </p>
        )}

        <div className="fee-actions-bar">
          <button className="approve-button" disabled={saving} onClick={handleSave}>
            <Check /> {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save Fee Schedule', 'حفظ جدول الرسوم')}
          </button>
        </div>
      </div>

      {/* Add Country Modal */}
      {addCountryOpen && (
        <div className="worker-modal" role="dialog" aria-modal="true">
          <div className="standard-modal-card">
            <div className="modal-header-row">
              <div>
                <h2>{t('Add New Source Country', 'إضافة دولة استقدام جديدة')}</h2>
                <p>{t('Add accredited bilateral labor partner and set statutory SAR fee.', 'إضافة دولة مصدرة وتحديد الرسوم المعتمدة.')}</p>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setAddCountryOpen(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleAddNewCountry} className="modal-form-grid">
              <Field label={t('Country Name *', 'اسم الدولة *')}>
                <input required name="country" placeholder={t('e.g. Morocco, Vietnam, Nepal', 'مثال: المغرب، فيتنام، نيبال')} />
              </Field>
              <Field label={t('Statutory Recruitment Fee (SAR) *', 'رسوم الاستقدام النظامية (ريال) *')}>
                <input required name="fee" type="number" step="100" defaultValue="12500" />
              </Field>

              <div className="modal-form-actions">
                <button type="button" className="delete-cancel" onClick={() => setAddCountryOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </button>
                <button type="submit" className="approve-button">
                  <Check /> {t('Add to Fee Schedule', 'إضافة لجدول الرسوم')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

/* ========================================================================= */
/* 6. SUPER ADMIN USER ACCESS MANAGEMENT (IN-APP CONFIRMATION)               */
/* ========================================================================= */

const SuperAdminUserManagement = memo(function SuperAdminUserManagement({
  language, compact, onShowToast
}: {
  language: 'en' | 'ar'
  compact?: boolean
  onShowToast: (msg: string) => void
}) {
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])
  const [roles, setRoles] = useState<Array<{ user_id: string; role: string }>>([
    { user_id: 'admin@fanfaisal.sa', role: 'admin' },
    { user_id: 'director@fanfaisal.sa', role: 'super_admin' },
    { user_id: 'sponsor@fanfaisal.sa', role: 'sponsor' },
  ])
  const [newUserId, setNewUserId] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [saving, setSaving] = useState(false)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await neonClient.from('user_roles').select('user_id, role').order('created_at', { ascending: false })
      if (data && data.length) setRoles(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const saveRole = useCallback(async () => {
    if (!newUserId.trim()) return
    setSaving(true)
    const userToSave = newUserId.trim()
    const roleToSave = newRole
    setRoles((prev) => [{ user_id: userToSave, role: roleToSave }, ...prev.filter((r) => r.user_id !== userToSave)])
    setNewUserId('')
    setSaving(false)
    onShowToast(t('Access permissions granted successfully', 'تم منح الصلاحيات بنجاح'))

    try {
      await neonClient.from('user_roles').upsert({
        user_id: userToSave,
        role: roleToSave,
        updated_at: new Date().toISOString()
      })
    } catch {
      // offline fallback
    }
  }, [newUserId, newRole, onShowToast, t])

  const updateRole = useCallback(async (userId: string, role: string) => {
    setRoles((prev) => prev.map((r) => r.user_id === userId ? { ...r, role } : r))
    onShowToast(t(`Updated ${userId} role to ${role}`, `تم تحديث صلاحية ${userId} إلى ${role}`))
    try {
      await neonClient.from('user_roles').update({ role, updated_at: new Date().toISOString() }).eq('user_id', userId)
    } catch {
      // fallback
    }
  }, [onShowToast, t])

  const handleConfirmDeleteRole = useCallback(async (userId: string) => {
    setRoles((prev) => prev.filter((r) => r.user_id !== userId))
    setDeleteConfirmUser(null)
    onShowToast(t('User role revoked', 'تم إلغاء صلاحيات المستخدم'))
    try {
      await neonClient.from('user_roles').delete().eq('user_id', userId)
    } catch {
      // fallback
    }
  }, [onShowToast, t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="user-add-bar">
        <input
          placeholder={t('Enter User ID or Email', 'أدخل معرّف المستخدم أو البريد الإلكتروني')}
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
        />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
          <option value="admin">{t('Admin', 'مدير')}</option>
          <option value="sponsor">{t('Sponsor', 'كفيل')}</option>
          <option value="super_admin">{t('Super Admin', 'مدير أعلى')}</option>
        </select>
        <button onClick={saveRole} disabled={saving}>
          {saving ? t('Saving…', 'جارٍ الحفظ…') : t('Grant Access', 'إضافة مستخدم')}
        </button>
      </div>

      <div className="role-cards-grid">
        {roles.map((item) => (
          <div key={item.user_id} className="role-user-item">
            <div className="role-user-left">
              <span className="role-avatar-circle">
                {item.user_id.slice(0, 2).toUpperCase()}
              </span>
              <div className="role-user-info">
                <strong>{item.user_id}</strong>
                <small>{t('Authenticated User', 'حساب موثق')}</small>
              </div>
            </div>
            <div className="role-user-right">
              <select
                className="role-select-box"
                value={item.role}
                onChange={(e) => updateRole(item.user_id, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="sponsor">Sponsor</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                className="role-delete-btn"
                onClick={() => setDeleteConfirmUser(item.user_id)}
                aria-label="Remove role"
                title="Remove role"
              >
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* In-app Revoke Confirmation Dialog */}
      {deleteConfirmUser && (
        <div className="worker-modal" role="dialog" aria-modal="true">
          <div className="delete-dialog" role="alertdialog">
            <div className="delete-icon"><Trash2 /></div>
            <div className="delete-copy">
              <span className="delete-kicker">{t('Access Control', 'إدارة الصلاحيات')}</span>
              <h2>{t('Revoke user role?', 'إلغاء صلاحيات المستخدم؟')}</h2>
              <p>{t(`Revoking access for: ${deleteConfirmUser}`, `أنت على وشك إلغاء الصلاحيات للحساب: ${deleteConfirmUser}`)}</p>
            </div>
            <div className="delete-actions">
              <button className="delete-cancel" onClick={() => setDeleteConfirmUser(null)}>
                {t('Cancel', 'إلغاء')}
              </button>
              <button className="delete-confirm" onClick={() => handleConfirmDeleteRole(deleteConfirmUser)}>
                {t('Revoke Role', 'تأكيد الإلغاء')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

/* ========================================================================= */
/* 7. HELPER COMPONENTS (MODALS, CHIPS, FORMS)                               */
/* ========================================================================= */

const DeleteConfirm = memo(function DeleteConfirm({
  worker, language, onCancel, onConfirm
}: {
  worker: Worker
  language: 'en' | 'ar'
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const isArabic = language === 'ar'
  const t = useCallback((en: string, ar: string) => isArabic ? ar : en, [isArabic])

  return (
    <div
      className="delete-backdrop"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) onCancel() }}
    >
      <div className="delete-dialog" role="alertdialog">
        <div className="delete-icon"><Trash2 /></div>
        <div className="delete-copy">
          <span className="delete-kicker">{t('Permanent Action', 'إجراء لا رجعة فيه')}</span>
          <h2>{t('Delete candidate profile?', 'حذف ملف المرشح نهائياً؟')}</h2>
          <p>
            {t(
              `You are about to remove ${worker.name} from your official recruitment directory.`,
              `أنت على وشك حذف ملف ${worker.name} نهائياً من قاعدة بيانات الاستقدام.`
            )}
          </p>
          <div className="delete-warning">
            {t('This action cannot be undone and will unpublish the CV.', 'سيتم إلغاء نشر السيرة الذاتية وإزالتها من النظام فوراً.')}
          </div>
        </div>
        <div className="delete-actions">
          <button className="delete-cancel" disabled={deleting} onClick={onCancel}>
            {t('Cancel', 'إلغاء')}
          </button>
          <button className="delete-confirm" disabled={deleting} onClick={async () => { setDeleting(true); await onConfirm() }}>
            {deleting ? t('Deleting…', 'جارٍ الحذف…') : t('Delete Profile', 'تأكيد الحذف')}
          </button>
        </div>
      </div>
    </div>
  )
})

function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="chip-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'selected' : ''}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="section-title">
      <span>{label}</span>
      <h2>{title}</h2>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Select({
  name,
  options,
  defaultValue,
  value,
  onChange,
  required,
  placeholder
}: {
  name?: string
  options: string[]
  defaultValue?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="select-wrap">
      <select
        required={required}
        name={name}
        {...(value !== undefined ? { value, onChange } : { defaultValue: defaultValue ?? '', onChange })}
      >
        <option value="" disabled>{placeholder || 'Choose an option'}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown />
    </div>
  )
}

function ChoiceGroup({ name, label, options, defaultValue, onChange }: { name: string; label: string; options: string[]; defaultValue?: string; onChange?: (v: string) => void }) {
  const [selected, setSelected] = useState(defaultValue || options[0])
  useEffect(() => {
    if (defaultValue) setSelected(defaultValue)
  }, [defaultValue])

  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      <input type="hidden" name={name} value={selected} />
      <div>
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={selected === option ? 'chosen' : ''}
            onClick={() => { setSelected(option); onChange?.(option) }}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function PhotoUpload({
  label, value, compact, inputRef, onSelect, onClear
}: {
  label: string
  value: string
  compact?: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: (file: File) => void
  onClear?: () => void
}) {
  return (
    <div className={`photo-field ${compact ? 'compact' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>{label}</label>
        {value && onClear && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
          >
            ✕ Remove
          </button>
        )}
      </div>
      <button type="button" className="photo-drop" onClick={() => inputRef.current?.click()}>
        {value ? (
          <img src={value} alt="Preview" />
        ) : (
          <>
            <ImagePlus style={{ width: 28, height: 28, marginBottom: 8, color: '#8fa1b2' }} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>Upload Photo</span>
          </>
        )}
        <span className="upload-overlay">
          <Upload /> Change photo
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
      />
    </div>
  )
}
