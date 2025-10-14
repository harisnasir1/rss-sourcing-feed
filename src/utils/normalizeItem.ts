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

  // Derive a concise product name and sanitize price/size tokens
  const primaryName = raw.name || raw.productName || raw.title || ''
  const firstSentence = raw.description ? String(raw.description).split(/[\n\.-]/)[0].trim() : ''
  const nameSource = String(primaryName || '').trim() || firstSentence
  let name = stripPriceAndSize(nameSource)
  if (!name) {
    const brand = raw.brand ? String(raw.brand).trim() : ''
    const productAlias = (raw.productName || raw.productType || raw.title || '') as string
    const combined = [brand, String(productAlias).trim()].filter(Boolean).join(' ')
    const alt = stripPriceAndSize(combined)
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
