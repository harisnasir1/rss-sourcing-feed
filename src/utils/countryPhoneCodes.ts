import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  CountryCode,
  getExampleNumber,
  AsYouType,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'

export type CountryPhone = {
  code: CountryCode      // ISO 3166-1 alpha-2 e.g. "GB"
  name: string
  dialCode: string       // e.g. "+44"
  flag: string           // emoji flag
}

const flagEmoji = (cc: string) =>
  String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))


const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })


export const countries: CountryPhone[] = getCountries().map((code) => ({
  code,
  name: displayNames.of(code) || code,
  dialCode: `+${getCountryCallingCode(code)}`,
  flag: flagEmoji(code),
}))


const priorityCodes = new Set<CountryCode>(['GB', 'US', 'IN', 'PK', 'AE', 'SA', 'AU', 'CA'])

export const sortedCountries: CountryPhone[] = [
  ...countries.filter(c => priorityCodes.has(c.code)),
  ...countries.filter(c => !priorityCodes.has(c.code)).sort((a, b) => a.name.localeCompare(b.name)),
]


export function getMaxLength(countryCode: CountryCode): number {
  try {
    const example = getExampleNumber(countryCode, examples)
    if (example) {
     
      return example.nationalNumber.length + 2
    }
  } catch { }
  return 15 
}

export function findCountryByDialCode(dialCode: string): CountryCode | undefined {
  return countries.find(c => c.dialCode === dialCode)?.code
}


export function validatePhone(dialCode: string, nationalNumber: string): {
  valid: boolean
  formatted?: string
  reason?: string
} {
  try {
    const full = `${dialCode}${nationalNumber}`
    const parsed = parsePhoneNumberFromString(full)
    if (!parsed) return { valid: false, reason: 'Could not parse number' }
    if (!parsed.isValid()) return { valid: false, reason: 'Invalid phone number' }
    return { valid: true, formatted: parsed.format('E.164') }
  } catch {
    return { valid: false, reason: 'Could not validate number' }
  }
}


export function detectCountryFromDigits(digits: string): {
  dialCode: string
  nationalNumber: string
  countryCode: CountryCode
} | null {
  try {
    const parsed = parsePhoneNumberFromString(`+${digits}`)
    if (parsed && parsed.country) {
      return {
        dialCode: `+${getCountryCallingCode(parsed.country)}`,
        nationalNumber: parsed.nationalNumber,
        countryCode: parsed.country,
      }
    }
  } catch { }
  return null
}

export function formatAsYouType(dialCode: string, nationalNumber: string): string {
  try {
    const formatter = new AsYouType()
    const formatted = formatter.input(`${dialCode}${nationalNumber}`)
    // Strip the dial code portion from the formatted string
    const dialPart = dialCode.replace('+', '')
    const idx = formatted.indexOf(dialPart)
    if (idx >= 0) {
      return formatted.slice(idx + dialPart.length).trim()
    }
    return nationalNumber
  } catch {
    return nationalNumber
  }
}