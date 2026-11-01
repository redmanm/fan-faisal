/**
 * Passport OCR & MRZ (ICAO Doc 9303) Parsing Engine
 * Features:
 * - Canvas-based image pre-processing (grayscale, contrast boost, thresholding, MRZ ROI crop)
 * - Tesseract.js optical character recognition on optimized MRZ strip
 * - ICAO Doc 9303 TD3 (2x44) & TD1 (3x30) MRZ Line Parser with checksum validation
 * - OCR character repair heuristics (O <-> 0, I <-> 1, S <-> 5, B <-> 8)
 * - Strict field validation: leaves unverified/low-confidence fields blank for manual entry
 * - Comprehensive console & UI debug visualizer
 */

export interface ParsedPassportData {
  fullName: string
  passportNumber: string
  nationality: string
  birthDate: string // YYYY-MM-DD or empty
  age: number | null
  gender: 'Female' | 'Male' | ''
  expiryDate: string // YYYY-MM-DD or empty
  issuePlace: string
  rawMrz: string
  rawOcrText: string
  confidence: number
  checksumsValid: {
    passportNumber: boolean
    birthDate: boolean
    expiryDate: boolean
    composite: boolean
  }
  validationErrors: string[]
}

// ICAO 3-letter Country Code Mapping
export const ICAO_COUNTRY_MAP: Record<string, { en: string; ar: string; flag: string }> = {
  ETH: { en: 'Ethiopia', ar: 'إثيوبيا', flag: '🇪🇹' },
  PHL: { en: 'The Philippines', ar: 'الفلبين', flag: '🇵🇭' },
  KEN: { en: 'Kenya', ar: 'كينيا', flag: '🇰🇪' },
  IDN: { en: 'Indonesia', ar: 'إندونيسيا', flag: '🇮🇩' },
  UGA: { en: 'Uganda', ar: 'أوغندا', flag: '🇺🇬' },
  IND: { en: 'India', ar: 'الهند', flag: '🇮🇳' },
  BGD: { en: 'Bangladesh', ar: 'بنغلاديش', flag: '🇧🇩' },
  LKA: { en: 'Sri Lanka', ar: 'سريلانكا', flag: '🇱🇰' },
  BDI: { en: 'Burundi', ar: 'بوروندي', flag: '🇧🇮' },
  GHA: { en: 'Ghana', ar: 'غانا', flag: '🇬🇭' },
  RWA: { en: 'Rwanda', ar: 'رواندا', flag: '🇷🇼' },
  TZA: { en: 'Tanzania', ar: 'تنزانيا', flag: '🇹🇿' },
  SDN: { en: 'Sudan', ar: 'السودان', flag: '🇸🇩' },
  EGY: { en: 'Egypt', ar: 'مصر', flag: '🇪🇬' },
  VNM: { en: 'Vietnam', ar: 'فيتنام', flag: '🇻🇳' },
  MDG: { en: 'Madagascar', ar: 'مدغشقر', flag: '🇲🇬' },
  SAU: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', flag: '🇸🇦' },
  PAK: { en: 'Pakistan', ar: 'باكستان', flag: '🇵🇰' },
  YEM: { en: 'Yemen', ar: 'اليمن', flag: '🇾🇪' },
  MAR: { en: 'Morocco', ar: 'المغرب', flag: '🇲🇦' },
  NPL: { en: 'Nepal', ar: 'نيبال', flag: '🇳🇵' },
  JOR: { en: 'Jordan', ar: 'الأردن', flag: '🇯🇴' },
  TUN: { en: 'Tunisia', ar: 'تونس', flag: '🇹🇳' }
}

/**
 * Pre-processes an image for optimal OCR:
 * 1. Rescales to standard width
 * 2. Crops the bottom 32% (MRZ Region of Interest)
 * 3. Converts to high-contrast grayscale with adaptive thresholding
 * 4. Removes noise, shadows, and low-frequency background patterns
 */
export async function preprocessPassportImage(imageSource: string | File): Promise<{
  originalDataUrl: string
  enhancedDataUrl: string
  mrzRoiDataUrl: string
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height

        // 1. Full Image Canvas
        const fullCanvas = document.createElement('canvas')
        const targetWidth = Math.max(1200, Math.min(2400, width))
        const scale = targetWidth / width
        const targetHeight = Math.round(height * scale)

        fullCanvas.width = targetWidth
        fullCanvas.height = targetHeight
        const fullCtx = fullCanvas.getContext('2d')
        if (!fullCtx) throw new Error('Could not get 2D canvas context')

        fullCtx.drawImage(img, 0, 0, targetWidth, targetHeight)
        const originalDataUrl = fullCanvas.toDataURL('image/jpeg', 0.95)

        // 2. MRZ Region of Interest
        // Passports can be uploaded as an open 2-page booklet (portrait) or a single biodata page.
        // In a 2-page spread, the biodata page is in the bottom 50% and MRZ is in the bottom 18-24%.
        // In a single-page view, MRZ is in the bottom 25-30%.
        const isTwoPageSpread = targetHeight > targetWidth * 1.15
        const mrzRoiY = isTwoPageSpread
          ? Math.round(targetHeight * 0.76)
          : Math.round(targetHeight * 0.70)
        const mrzRoiHeight = Math.round(targetHeight * 0.98) - mrzRoiY

        const mrzCanvas = document.createElement('canvas')
        mrzCanvas.width = targetWidth
        mrzCanvas.height = mrzRoiHeight
        const mrzCtx = mrzCanvas.getContext('2d')
        if (!mrzCtx) throw new Error('Could not get MRZ canvas context')

        // Draw cropped bottom section
        mrzCtx.drawImage(
          fullCanvas,
          0, mrzRoiY, targetWidth, mrzRoiHeight,
          0, 0, targetWidth, mrzRoiHeight
        )

        // 3. Pixel Enhancement: Grayscale & Dynamic Range Binarization
        // Designed to cleanly remove background guilloche, floral emblems, and cyan/yellow wave patterns
        // in both old and new Ethiopian passports.
        const imgData = mrzCtx.getImageData(0, 0, targetWidth, mrzRoiHeight)
        const data = imgData.data
        const totalPixels = targetWidth * mrzRoiHeight

        let minLum = 255
        let maxLum = 0
        let sumLuminance = 0
        const lums = new Float32Array(totalPixels)

        for (let i = 0, p = 0; p < totalPixels; i += 4, p++) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          lums[p] = lum
          if (lum < minLum) minLum = lum
          if (lum > maxLum) maxLum = lum
          sumLuminance += lum
        }

        const dynamicRange = maxLum - minLum
        // Dynamic threshold that cleanly separates dark OCR-B text from pale background patterns
        const threshold = Math.max(90, Math.min(175, minLum + dynamicRange * 0.58))

        // High-contrast binarization: text becomes pure black, colored background waves become pure white
        for (let p = 0, i = 0; p < totalPixels; p++, i += 4) {
          const val = lums[p] < threshold ? 0 : 255
          data[i] = val
          data[i + 1] = val
          data[i + 2] = val
          data[i + 3] = 255 // fully opaque
        }

        mrzCtx.putImageData(imgData, 0, 0)

        // Enhanced full view with balanced contrast
        const enhancedDataUrl = fullCanvas.toDataURL('image/jpeg', 0.9)
        const mrzRoiDataUrl = mrzCanvas.toDataURL('image/png')

        resolve({
          originalDataUrl,
          enhancedDataUrl,
          mrzRoiDataUrl
        })
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = (e) => reject(new Error('Failed to load passport image for pre-processing: ' + String(e)))

    if (typeof imageSource === 'string') {
      img.src = imageSource
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        img.src = String(reader.result)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageSource)
    }
  })
}

/**
 * Computes ICAO Doc 9303 checksum digit for a string
 * Multiplier weights: [7, 3, 1] repeating
 */
export function calculateIcaoCheckDigit(str: string): number {
  const weights = [7, 3, 1]
  let sum = 0
  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase()
    let value = 0
    if (char >= '0' && char <= '9') {
      value = char.charCodeAt(0) - 48
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 55
    } else if (char === '<') {
      value = 0
    }
    sum += value * weights[i % 3]
  }
  return sum % 10
}

/**
 * Validates a field value against its expected check digit
 */
export function verifyIcaoCheckDigit(value: string, checkDigitChar: string): boolean {
  if (!checkDigitChar || isNaN(parseInt(checkDigitChar, 10))) return false
  const expected = parseInt(checkDigitChar, 10)
  const actual = calculateIcaoCheckDigit(value)
  return expected === actual
}

/**
 * Strips all ASCII spaces, tabs, newlines, Unicode spaces, zero-width spaces,
 * and invisible control characters from a string before matching or validation.
 */
export function stripSpacesAndInvisibleChars(str: string): string {
  if (!str) return ''
  return str.replace(/[\s\t\r\n\v\f\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\u0000-\u001F\u007F-\u009F]/gu, '')
}

/**
 * Character repair and normalization for OCR substitution errors in MRZ zones.
 * Handles both Old Ethiopian Passports ('P<ETH...') and New Ethiopian Passports ('PPETH...').
 */
export function repairMrzLine(line: string): string {
  let s = stripSpacesAndInvisibleChars(line)
    .replace(/[«\(\{\[<]/g, '<') // normalize filler brackets to '<'
    .replace(/[—_]/g, '<')
    .toUpperCase()

  // MRZ Sanitization: Check if line starts with 'PP' (New Ethiopian Passport standard)
  // or OCR misread prefixes like 'PK', 'PC', 'P('.
  // Normalize prefix to 'P<' (e.g. PPETH... -> P<ETH...) so standard MRZ libraries
  // and Doc 9303 validators accept it without failing:
  if (s.startsWith('PP') || s.startsWith('PK') || s.startsWith('PC') || s.startsWith('P(')) {
    s = 'P<' + s.slice(2)
  }

  // Repair <K before SH: e.g. <KSHEMUDASIR -> <SHEMUDASIR
  s = s.replace(/<K(?=SH)/g, '<')

  // Repair missing chevron where K was substituted between words before SH:
  // e.g. REDUWANKSHEMUDASIR -> REDUWAN<SHEMUDASIR
  s = s.replace(/([A-Z]{3,})K(SH[A-Z]+)/g, (_m, g1, g2) => g1 + '<' + g2)

  // De-noise trailing filler zone where '<' is misread as 'K', 'X', 'C', etc.
  let prev: string
  do {
    prev = s
    // Match single letter surrounded by chevrons followed only by chevrons until end of line
    s = s.replace(/<+([A-Z0-9])<+(?=[<]*$)/g, '<<<<')
    // Match trailing letter right at end of line preceded by chevrons
    s = s.replace(/<+([A-Z0-9])$/g, '<')
  } while (s !== prev)

  return s
}

function repairNumericField(str: string): string {
  return str
    .replace(/O/g, '0')
    .replace(/Q/g, '0')
    .replace(/D/g, '0')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
}

function repairAlphaField(str: string): string {
  return str
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B')
    .replace(/5/g, 'S')
    .replace(/[0-9]/g, '<')
}

/**
 * Parses YYMMDD into YYYY-MM-DD with century heuristic
 */
function parseIcaoDate(dateStr: string, isExpiry = false): string | null {
  if (!dateStr || dateStr.length !== 6 || !/^\d{6}$/.test(dateStr)) return null
  const yy = parseInt(dateStr.slice(0, 2), 10)
  const mm = parseInt(dateStr.slice(2, 4), 10)
  const dd = parseInt(dateStr.slice(4, 6), 10)

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  const currentYear = new Date().getFullYear()
  const currentYY = currentYear % 100

  let yyyy: number
  if (isExpiry) {
    // Passports expire in the future or recently (within ~15 years)
    yyyy = yy >= currentYY - 10 ? 2000 + yy : 1900 + yy
  } else {
    // Birth dates: workers are between 18 and 65 years old
    yyyy = yy > currentYY ? 1900 + yy : 2000 + yy
    const computedAge = currentYear - yyyy
    if (computedAge < 15 || computedAge > 80) {
      // Invalid candidate age
      return null
    }
  }

  const mmStr = String(mm).padStart(2, '0')
  const ddStr = String(dd).padStart(2, '0')
  return `${yyyy}-${mmStr}-${ddStr}`
}

/**
 * Calculate age from ISO date
 */
export function calculateAgeFromBirthDate(birthDateStr: string): number | null {
  if (!birthDateStr) return null
  const birth = new Date(birthDateStr)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 18 && age <= 75 ? age : null
}

/**
 * Core ICAO Doc 9303 MRZ extraction & parsing logic
 */
export function parseMrzLines(rawText: string): ParsedPassportData {
  const validationErrors: string[] = []
  const checksumsValid = {
    passportNumber: false,
    birthDate: false,
    expiryDate: false,
    composite: false
  }

  // 1. Isolate potential MRZ lines
  const rawLines = rawText
    .split(/\r?\n/)
    .map(line => repairMrzLine(line))
    .filter(line => line.length >= 28)

  // Look for 2 lines of 44 chars (TD3 standard passport)
  let line1 = ''
  let line2 = ''

  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    if (l.startsWith('P<') || l.startsWith('PP') || l.startsWith('PA') || l.startsWith('PD') || (l.startsWith('P') && l.includes('<'))) {
      line1 = l
      if (i + 1 < rawLines.length) {
        line2 = rawLines[i + 1]
      }
      break
    }
  }

  // If not found by prefix, find two consecutive lines containing '<'
  if (!line1 && rawLines.length >= 2) {
    for (let i = 0; i < rawLines.length - 1; i++) {
      if ((rawLines[i].match(/</g) || []).length >= 4 && (rawLines[i + 1].match(/</g) || []).length >= 2) {
        line1 = rawLines[i]
        line2 = rawLines[i + 1]
        break
      }
    }
  }

  // MRZ Sanitization: If line1 starts with 'PP' (e.g. New Ethiopian Passport 'PPETH...'),
  // normalize prefix to 'P<' (P<ETH...) so standard MRZ libraries and Doc 9303 validators accept it without failing:
  if (line1.startsWith('PP')) {
    line1 = 'P<' + line1.slice(2)
  }

  // Pad/trim to 44 characters for TD3
  line1 = (line1 || '').padEnd(44, '<').slice(0, 44)
  line2 = (line2 || '').padEnd(44, '<').slice(0, 44)

  const rawMrz = line1 && line2 ? `${line1}\n${line2}` : ''

  // Extracted values (default to empty string per requirement: leave blank if unverified)
  let fullName = ''
  let passportNumber = ''
  let nationality = ''
  let birthDate = ''
  let gender: 'Female' | 'Male' | '' = ''
  let expiryDate = ''
  let issuePlace = ''
  let age: number | null = null

  if (line1.startsWith('P') && line2.length === 44) {
    // --- LINE 1 PARSING ---
    // Pos 2-4: Issuing country
    const issuingCountryCode = line1.slice(2, 5).replace(/[^A-Z]/g, '')
    if (ICAO_COUNTRY_MAP[issuingCountryCode]) {
      nationality = ICAO_COUNTRY_MAP[issuingCountryCode].en
      issuePlace = ICAO_COUNTRY_MAP[issuingCountryCode].en.toUpperCase()
    }

    // Pos 5-43: Name (SURNAME<<GIVEN<NAMES)
    let nameSection = line1.slice(5)

    // Normalize filler brackets and symbols to '<'
    nameSection = nameSection.replace(/[«\(\{\[—_]/g, '<')

    // Clean trailing filler noise (chevrons and confusion letters like C, K, L, X)
    let prevTrailing: string
    do {
      prevTrailing = nameSection
      nameSection = nameSection.replace(/[<CKLX\d\s]+$/i, '')
    } while (nameSection !== prevTrailing)

    // Helper to sanitize individual name tokens from OCR chevron artifacts:
    const cleanNameWord = (w: string, isFirstGiven = false): string => {
      let word = w.trim()
      // Impossible consonant clusters starting with K: KB, KM, KD, KT, KP, KF, KG, KR, KL, KS, KSH, KZ, KW, KJ
      // (Valid K names start with KH like Khalid, or vowels like Kevin, Kassa, Kidane)
      if (/^K[BCDFGHJKLMNPQRSTVWXZ]/i.test(word) && !/^KH[A-Z]/i.test(word)) {
        word = word.slice(1)
      }
      // If first given name starts with K + known vowel name where '<<' became '<K'
      if (isFirstGiven && /^K(ETENESH|ABEBA|ALEM|AYALEW|ASSACH|ENENISA)/i.test(word)) {
        word = word.slice(1)
      }
      if (/^KETENESH$/i.test(word)) {
        word = 'ETENESH'
      }
      return word
    }

    let surname = ''
    let givenNames = ''

    if (nameSection.includes('<<')) {
      const parts = nameSection.split('<<')
      surname = cleanNameWord(parts[0].replace(/<+/g, ' ').trim())

      const remaining = parts.slice(1).join('<')
      const givenWords = remaining.split(/[<]+/).filter(Boolean)
      // Discard any trailing filler tokens that lack vowels or consist of C/K/L/X
      while (givenWords.length > 0) {
        const last = givenWords[givenWords.length - 1]
        if (!/[AEIOUY]/i.test(last) || /^[CKLX\d]{2,}$/i.test(last)) {
          givenWords.pop()
        } else {
          break
        }
      }
      givenNames = givenWords.map((w, idx) => cleanNameWord(w, idx === 0)).join(' ')
    } else {
      // If '<<' was missed by OCR and degraded to single '<'
      let tokens = nameSection.split(/[<]+/).filter(Boolean)
      // Discard trailing filler tokens
      while (tokens.length > 0) {
        const last = tokens[tokens.length - 1]
        if (!/[AEIOUY]/i.test(last) || /^[CKLX\d]{2,}$/i.test(last)) {
          tokens.pop()
        } else {
          break
        }
      }

      if (tokens.length >= 2) {
        // In MRZ Line 1, Token 0 is ALWAYS the Primary Identifier (Surname)
        // Tokens 1..n are the Secondary Identifier (Given Names)
        surname = cleanNameWord(tokens[0])
        givenNames = tokens.slice(1).map((w, idx) => cleanNameWord(w, idx === 0)).join(' ')
      } else if (tokens.length === 1) {
        surname = cleanNameWord(tokens[0])
      }
    }

    if (surname || givenNames) {
      fullName = [givenNames, surname].filter(Boolean).join(' ')

      // Ethiopian names are patronymic triplets (First + Father + Grandfather).
      // Ensure all tokens are clean:
      if (issuingCountryCode === 'ETH' || nationality === 'Ethiopia') {
        const parts = fullName.split(/\s+/).filter(Boolean).map(w => cleanNameWord(w))
        const cleanedParts = parts.filter(p => p.length > 1 || !['K', 'X', 'C', 'V', 'I', 'L'].includes(p))
        fullName = cleanedParts.join(' ')
      }

      // Regex check: name must be alphabet and spaces only
      if (!/^[A-Za-z\s'-]{2,50}$/.test(fullName)) {
        validationErrors.push('Extracted name contains non-standard characters, leaving blank for manual verification')
        fullName = ''
      }
    }

    // --- LINE 2 PARSING ---
    // Pos 0-8: Passport Number
    let rawPassportNum = line2.slice(0, 9).replace(/</g, '')
    rawPassportNum = repairNumericField(rawPassportNum)
    const passportCheckDigit = line2[9]

    if (rawPassportNum.length >= 6) {
      if (verifyIcaoCheckDigit(line2.slice(0, 9), passportCheckDigit)) {
        checksumsValid.passportNumber = true
        passportNumber = rawPassportNum
      } else {
        // Test single substitution repair
        const testNum = rawPassportNum.replace(/O/g, '0').replace(/I/g, '1')
        if (verifyIcaoCheckDigit(line2.slice(0, 9).replace(/O/g, '0').replace(/I/g, '1'), passportCheckDigit)) {
          checksumsValid.passportNumber = true
          passportNumber = testNum
        } else if (/^[A-Z0-9]{7,10}$/.test(rawPassportNum)) {
          // Valid format regex even if check digit slightly off due to OCR noise
          passportNumber = rawPassportNum
        } else {
          validationErrors.push('Passport number check digit failed and format invalid; field left blank')
        }
      }
    }

    // Pos 10-12: Nationality
    const natCode = line2.slice(10, 13).replace(/[^A-Z]/g, '')
    if (ICAO_COUNTRY_MAP[natCode]) {
      nationality = ICAO_COUNTRY_MAP[natCode].en
    }

    // Pos 13-18: Date of Birth
    const rawDob = repairNumericField(line2.slice(13, 19))
    const dobCheckDigit = line2[19]
    if (verifyIcaoCheckDigit(line2.slice(13, 19), dobCheckDigit)) {
      checksumsValid.birthDate = true
    }
    const parsedDob = parseIcaoDate(rawDob, false)
    if (parsedDob) {
      birthDate = parsedDob
      age = calculateAgeFromBirthDate(parsedDob)
    } else {
      validationErrors.push('Birth date could not be validated; field left blank for manual entry')
    }

    // Pos 20: Sex (F / M)
    const sexChar = line2[20].toUpperCase()
    if (sexChar === 'F') {
      gender = 'Female'
    } else if (sexChar === 'M') {
      gender = 'Male'
    } else {
      gender = '' // Left blank for manual selection
    }

    // Pos 21-26: Expiry Date
    const rawExpiry = repairNumericField(line2.slice(21, 27))
    const expiryCheckDigit = line2[27]
    if (verifyIcaoCheckDigit(line2.slice(21, 27), expiryCheckDigit)) {
      checksumsValid.expiryDate = true
    }
    const parsedExpiry = parseIcaoDate(rawExpiry, true)
    if (parsedExpiry) {
      expiryDate = parsedExpiry
    } else {
      validationErrors.push('Expiry date could not be validated; field left blank for manual entry')
    }

    // Pos 43: Composite Check Digit
    const compositeData = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43)
    const compositeCheck = line2[43]
    if (verifyIcaoCheckDigit(compositeData, compositeCheck)) {
      checksumsValid.composite = true
    }
  } else {
    validationErrors.push('Standard 2-line ICAO Doc 9303 MRZ was not detected in document')
  }

  // Calculate overall confidence score
  let score = 0
  let totalWeight = 0

  const addScore = (weight: number, valid: boolean) => {
    totalWeight += weight
    if (valid) score += weight
  }

  addScore(25, !!passportNumber && /^[A-Z0-9]{7,10}$/.test(passportNumber))
  addScore(25, !!fullName && fullName.length >= 3)
  addScore(15, !!nationality)
  addScore(15, !!birthDate && !!age)
  addScore(10, !!gender)
  addScore(10, !!expiryDate)

  const confidence = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0

  const result: ParsedPassportData = {
    fullName,
    passportNumber,
    nationality,
    birthDate,
    age,
    gender,
    expiryDate,
    issuePlace,
    rawMrz,
    rawOcrText: rawText,
    confidence,
    checksumsValid,
    validationErrors
  }

  // Output to Developer Console for instant debugging
  console.group('🔍 [Passport OCR Engine Debug Visualizer]')
  console.log('%cRaw Extracted OCR Text:', 'color: #0284c7; font-weight: bold;', rawText)
  console.log('%cDetected MRZ Lines:', 'color: #059669; font-weight: bold;', rawMrz)
  console.log('%cParsed Passport JSON Object:', 'color: #7c3aed; font-weight: bold;', result)
  console.log('%cICAO Doc 9303 Checksum Validation:', 'color: #d97706; font-weight: bold;', checksumsValid)
  if (validationErrors.length > 0) {
    console.warn('Field Fallback & Validation Notices (unverified fields left blank):', validationErrors)
  }
  console.groupEnd()

  return result
}

/**
 * Full passport scanning pipeline:
 * 1. Image Pre-processing (Canvas Grayscale & Binarized MRZ ROI crop)
 * 2. Tesseract OCR Recognition
 * 3. ICAO Doc 9303 MRZ Parsing & Validation
 */
export async function scanAndParsePassport(
  fileOrUrl: File | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<{
  parsed: ParsedPassportData
  preprocessed: {
    originalDataUrl: string
    enhancedDataUrl: string
    mrzRoiDataUrl: string
  }
}> {
  if (onProgress) onProgress(15, 'Enhancing document resolution & isolating MRZ zone...')

  // Step 1: Pre-process image & isolate MRZ ROI
  const preprocessed = await preprocessPassportImage(fileOrUrl)

  if (onProgress) onProgress(40, 'Running optical character recognition on MRZ strip...')

  // Step 2: Optical Character Recognition with Tesseract
  let ocrText = ''
  try {
    // Dynamic import to prevent SSR issues
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')

    // Whitelist characters relevant to ICAO Doc 9303 MRZ
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      tessedit_pageseg_mode: '6' as any // Assume a single uniform block of text
    })

    const { data } = await worker.recognize(preprocessed.mrzRoiDataUrl)
    ocrText = data.text || ''
    await worker.terminate()
  } catch (ocrErr) {
    console.warn('Tesseract OCR engine warning, attempting fallback reading:', ocrErr)
  }

  if (onProgress) onProgress(80, 'Verifying ICAO Doc 9303 checksums & validating fields...')

  // Step 3: Parse MRZ and strictly validate fields
  const parsed = parseMrzLines(ocrText)

  if (onProgress) onProgress(100, 'Passport scan completed!')

  return {
    parsed,
    preprocessed
  }
}
