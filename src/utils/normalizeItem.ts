export type RawItem = Record<string, any>

export type Item = {
  id: string
  name: string
  description: string
  images: string[]
  price: number | null
  displayPrice: string
  vendorName?: string
  vendorPhone?: string | null
  whatsappUrl?: string | null
  createdAt?: string
  meta: {
    brand?: string
    productType?: string
    size?: string
    condition?: string
    gender?: string
  }
  raw: RawItem
}

function cleanPhone(phone?: string): string | null {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  return digits.length >= 7 ? digits : null
}

function parseImages(arr: any[] = []): string[] {
  const out: string[] = []
  for (const v of arr) {
    try {
      if (typeof v === 'string') {
        const text = v.trim().replace(/^\s*["'{]+|["'}]+\s*$/g, '')
        const urls = text.match(/https?:\/\/[^\s'"\]\)]+/g)
        if (urls && urls.length) {
          out.push(...urls)
        } else if (text.startsWith('http')) {
          out.push(text)
        }
      } else if (Array.isArray(v)) {
        // nested arrays
        out.push(...parseImages(v))
      } else if (typeof v === 'object' && v !== null) {
        const vals = Object.values(v)
        for (const val of vals) {
          if (typeof val === 'string') {
            const urls = val.match(/https?:\/\/[^\s'"\]\)]+/g)
            if (urls && urls.length) out.push(...urls)
          }
        }
      }
    } catch {
      // ignore malformed
    }
  }
  return out.filter(Boolean)
}

export function normalizeItem(raw: RawItem): Item {
  function stripPriceAndSize(text: string): string {
    if (!text) return ''
    let out = ' ' + String(text) + ' ' // pad to simplify boundary patterns

    // Remove bracketed segments that contain price/size hints
    const bracketClean = (s: string, open: string, close: string) =>
      s.replace(new RegExp(`\\${open}([^${close}]*)\\${close}`, 'g'), (_m, inner: string) => {
        const hasPriceOrSize = /(£|\$|€|₹|\b(?:USD|GBP|EUR|Rs\.?|INR)\b)\s?\d|\bsize\b|\b(?:UK|US|EU)\s*\d|\b\d+\s?(?:gb|tb)\b/i.test(inner)
        return hasPriceOrSize ? '' : `${open}${inner}${close}`
      })
    out = bracketClean(out, '(', ')')
    out = bracketClean(out, '[', ']')

    // Currency leading/trailing, e.g., £1,200 or 1200 GBP, 1.2k, USD 500
    out = out
      .replace(/(^|\s)(?:£|\$|€|₹|\b(?:USD|GBP|EUR|Rs\.?|INR)\b)\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*([kKmM])?/g, ' ')
      .replace(/(^|\s)\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:£|\$|€|₹|\b(?:USD|GBP|EUR|Rs\.?|INR)\b)/g, ' ')
      .replace(/(^|\s)\d+(?:\.\d+)?\s?[kKmM]\b/g, ' ')

    // Explicit size phrases: Size 10, size: L, size-42
    out = out.replace(/(^|\s)size\s*[:\-]?\s*[a-z0-9.+/\-]+\b/gi, ' ')

    // Regional shoe sizes: UK 9, US 10.5, EU 42
    out = out.replace(/(^|\s)(UK|US|EU)\s*\d+(?:\.\d+)?\b/gi, ' ')

    // Dimensions: 42mm, 14cm, 6.5in, 15"; Storage: 128GB, 1 TB
    out = out
      .replace(/(^|\s)\d+(?:\.\d+)?\s*(?:mm|cm|in(?:ch(?:es)?)?|"|”)\b/gi, ' ')
      .replace(/(^|\s)\d+\s?(?:gb|tb)\b/gi, ' ')

    // Collapse separators left behind
    out = out
      .replace(/[\s\-_|•]{2,}/g, ' ')
      .replace(/[\s]*(?:[\-_|•]|\s\|\s)[\s]*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    // Trim trailing punctuation
    out = out.replace(/^[\-_|•,\s]+|[\-_|•,\s]+$/g, '')
    return out
  }
  // New: remove only price mentions (keep size and other fields)
  function stripPriceOnly(text: string): string {
    if (!text) return ''
    const lines = String(text).split(/\r?\n/)
    const priceWordRe = /(^|\b)(price|rrp)\b/i

    // Patterns to remove: composite prices like 900€/780£ or £900/$1000, and single tokens either order
    const sym = '(?:£|\\$|€|₹|USD|GBP|EUR|Rs\\.?|INR)'
    const amt = '\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?'
    const comboAmtFirst = new RegExp(`${amt}\\s*${sym}(?:\\s*\\/\\s*${amt}\\s*${sym})*`, 'gi')
    const comboSymFirst = new RegExp(`${sym}\\s*${amt}(?:\\s*\\/\\s*${sym}\\s*${amt})*`, 'gi')
    const singleAmtFirst = new RegExp(`(^|\\s)${amt}\\s*${sym}`, 'gi')
    const singleSymFirst = new RegExp(`(^|\\s)${sym}\\s*${amt}`, 'gi')
    const shorthandK = /(^|\s)\d+(?:\.\d+)?\s?[kKmM]\b/g

    const cleaned = lines
      // drop lines clearly marked as price/RRP
      .filter((ln) => !priceWordRe.test(ln))
      .map((ln) => ln
        // remove emphasis markers around prices to avoid leftover * _ wrapping tokens
        .replace(/[\*_]+(?=\d)/g, '')
        .replace(/(?<=\d)[\*_]+/g, '')
      )
      .map((ln) => ln
        // composite forms with slashes
        .replace(comboAmtFirst, ' ')
        .replace(comboSymFirst, ' ')
        // single tokens
        .replace(singleSymFirst, ' ')
        .replace(singleAmtFirst, ' ')
        // shorthand like 1.2k
        .replace(shorthandK, ' ')
      )
      .map((ln) => ln
        // collapse leftover markup-only fragments
        .replace(/[\*_]+/g, ' ')
        .replace(/[\s\-_/|•:]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      )
      // drop lines that became empty or punctuation-only
      .filter((ln) => ln && /[a-z0-9]/i.test(ln))

    return cleaned.join('\n').trim()
  }

  // --- URL helpers ---
  const urlRe = /https?:\/\/[^\s'"\]\)]+/gi
  const isUrlOnly = (s: string) => {
    const t = s.trim()
    if (!t) return false
    const m = t.match(urlRe)
    return !!m && m.length === 1 && m[0] === t
  }
  const extractFirstUrl = (s: string): string | null => {
    const m = s.match(urlRe)
    return m && m[0] ? m[0] : null
  }
  const removeUrlsFromText = (text: string): string => {
    const lines = String(text).split(/\r?\n/)
    const kept = lines
      .filter((ln) => !isUrlOnly(ln))
      .map((ln) => ln.replace(urlRe, ' ').replace(/\s{2,}/g, ' ').trim())
    return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  const toTitle = (s: string) => s.replace(/(^|\s)([a-z])/g, (_, a, b) => a + String(b).toUpperCase())
  const BRAND_KEYWORDS = [
    'nike','adidas','new balance','asics','salomon','reebok','converse','jordan','yeezy',
    'the north face','north face','tnf','arc\'?teryx','patagonia','columbia','carhartt',
    'stone island','cp company','moncler','canada goose','palace','supreme','stussy',
    'balenciaga','gucci','prada','louis vuitton','lv','dior','fendi','burberry','hermes',
    'off-white','fear of god','essentials','ami','acne studios','cos','uniqlo'
  ]
  const brandMatcher = (txt: string) => {
    const lower = txt.toLowerCase()
    for (const kw of BRAND_KEYWORDS) {
      // allow spaces or hyphens in between brand tokens
      const pattern = kw.replace(/\s+/g, '[\\s-]+')
      const re = new RegExp(`(^|[^a-z])${pattern}([^a-z]|$)`, 'i')
      if (re.test(lower)) return true
    }
    return false
  }
  const deriveNameFromUrl = (u: string): string => {
    try {
      const url = new URL(u)
      const rawParts = url.pathname.split('/').filter(Boolean)
      if (!rawParts.length) return url.hostname

      const clean = (s: string) => decodeURIComponent(s)
        .replace(/\.(html?|php|asp|aspx|json|htm)$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()

      const isGeneric = (s: string) => /^(products?|item|items|listing|listings|product|shop|store|collection|collections|category|categories)$/i.test(s.trim())
      const isLikelyId = (s: string) => {
        const t = s.replace(/\s+/g, '')
        // numeric-only or looks like a hex/uuid fragment
        return (/^\d+$/.test(t) || /[a-f0-9]{10,}/i.test(t))
      }
      const hasLetters = (s: string) => /[a-z]/i.test(s)
      const meaningful = (s: string) => hasLetters(s) && !isGeneric(s) && !isLikelyId(s) && s.replace(/\s+/g, '').length >= 3

      const cleaned = rawParts.map(clean)

      // 1) Brand-boost: pick the part with a brand keyword, and append the next meaningful part if needed
      for (let i = 0; i < cleaned.length; i++) {
        const part = cleaned[i]
        if (!meaningful(part)) continue
        if (brandMatcher(part)) {
          const words = part.split(/\s+/).length
          if (words >= 3) return toTitle(part)
          // try to append the next meaningful non-generic non-id segment
          if (i + 1 < cleaned.length) {
            const next = cleaned[i + 1]
            if (meaningful(next)) return toTitle(`${part} ${next}`)
          }
          // or try previous
          if (i - 1 >= 0) {
            const prev = cleaned[i - 1]
            if (meaningful(prev)) return toTitle(`${part} ${prev}`)
          }
          return toTitle(part)
        }
      }

      // 2) search from the end for the first meaningful part
      for (let i = cleaned.length - 1; i >= 0; i--) {
        const part = cleaned[i]
        if (meaningful(part)) return toTitle(part)
      }

      // 3) fallback: join last two parts if present
      if (cleaned.length >= 2) {
        const a = cleaned[cleaned.length - 2]
        const b = cleaned[cleaned.length - 1]
        const combo = [a, b].filter((x) => !isGeneric(x)).join(' ').trim()
        if (combo) return toTitle(combo)
      }

      // final fallback: hostname
      return toTitle(url.hostname.replace(/^www\./, ''))
    } catch {
      return u
    }
  }
  const isLowInfoText = (s: string): boolean => {
    const t = String(s).replace(/[*_`~]/g, '').trim()
    if (!t) return true
    const words = t.split(/\s+/).filter(Boolean)
    if (t.length < 20 || words.length < 3) return true
    // common low-info phrases
    if (/(available|in\s*stock|dm\s*to\s*buy|message\s*me|price\s*on\s*request)/i.test(t)) return true
    return false
  }
  const imageCandidates: any[] = Array.isArray(raw.images)
    ? raw.images
    : raw.images
    ? [raw.images]
    : Array.isArray(raw.photos)
    ? raw.photos
    : Array.isArray(raw.media)
    ? raw.media
    : Array.isArray(raw.imageUrls)
    ? raw.imageUrls
    : raw.image
    ? [raw.image]
    : []
  const images = parseImages(imageCandidates)
  const phone = cleanPhone(raw.vendorPhone || raw.vendor_phone || raw.phone)
  const priceRaw = raw.price ?? raw.priceString ?? null
  const priceNum = priceRaw != null && String(priceRaw).trim() !== '0' ? Number(priceRaw) || null : null
  const displayPrice = priceNum ? `£${priceNum.toLocaleString()}` : 'Contact for price'
  const whatsappUrl = phone ? `https://wa.me/${phone}` : (raw.whatsapp || raw.whatsappUrl || null)

  // Derive title: prefer full description but remove any mention of price
  const descFull = raw.description || raw.title || raw.body || ''
  const firstUrl = extractFirstUrl(String(descFull))
  const withoutUrls = removeUrlsFromText(String(descFull))
  const urlName = firstUrl ? deriveNameFromUrl(firstUrl) : ''
  let name = withoutUrls ? stripPriceOnly(withoutUrls) : ''
  // If the remaining text is trivial and we have a URL with a meaningful slug, prefer the URL-derived title
  if (firstUrl && (!name || isLowInfoText(name)) && urlName) {
    name = urlName
  }
  // Fallback: use other name fields with price-only cleanup
  if (!name) {
    const primaryName = raw.name || raw.productName || raw.title || ''
    const primaryNoUrls = removeUrlsFromText(String(primaryName))
    name = stripPriceOnly(primaryNoUrls)
  }
  // If still empty and we have a URL, derive a readable listing title from it
  if (!name && firstUrl) {
    name = deriveNameFromUrl(firstUrl)
  }
  if (!name) {
    const brand = raw.brand ? String(raw.brand).trim() : ''
    const productAlias = (raw.productName || raw.productType || raw.title || '') as string
    const combined = [brand, String(productAlias).trim()].filter(Boolean).join(' ')
    const alt = stripPriceOnly(combined)
    name = alt || brand || ''
  }

  return {
    id: String(raw.id || raw._id || Math.random()).trim(),
    name,
    description: raw.description || raw.title || raw.body || '',
    images,
    price: priceNum,
    displayPrice,
    vendorName: raw.vendorName || raw.vendor_name || raw.vendor || undefined,
    vendorPhone: phone,
    whatsappUrl: whatsappUrl || null,
    createdAt: raw.createdAt || raw.created_at || raw.time || undefined,
    meta: {
      brand: raw.brand,
      productType: raw.productType || raw.product_type,
      size: raw.size,
      condition: raw.condition,
      gender: raw.gender,
    },
    raw,
  }
}
