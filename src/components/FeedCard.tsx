import React, { useEffect, useMemo, useState,useCallback } from 'react'
import { buildWhatsAppHref } from '../utils/whatsapp'
import { Item as NormalizedItem } from '../utils/normalizeItem'
import { useAuth } from '../utils/AuthContext'
import { Link } from 'react-router-dom'
type Item = NormalizedItem

export default function FeedCard({
  item,
  isWtb = false,
  loggedIn = false,
  onRequireAuth,
  onlogout,
  onWhatsApp
}: {
  item: Item
  isWtb?: boolean
  loggedIn?: boolean
  onRequireAuth?: () => void
  onlogout?:()=>void
   onWhatsApp?: (vendorId: string, itemName: string,itemid:string, onLogout: () => void) => void
}) {
  const {token}=useAuth()
  const formatDate = (iso?: string) => {
    if (!iso) return { date: '', time: '' }
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    return { date, time }
  }
  const btnClass = isWtb
  ? 'btn-green px-4 py-2 text-sm rounded inline-block transition-colors'
  : 'btn-blue px-4 py-2 text-sm rounded inline-block transition-colors'
  const { date, time } = formatDate(item.createdAt)
  // local state used to trigger enter animation when the component mounts
  const [entered, setEntered] = useState(false)
const [loading, setLoading] = useState(false)
  // Recent within last 15 minutes
  const isRecent = useMemo(() => {
    if (!item.createdAt) return false
    const created = new Date(item.createdAt).getTime()
    if (Number.isNaN(created)) return false
    const fifteenMin = 15 * 60 * 1000
    return Date.now() - created <= fifteenMin
  }, [item.createdAt])

  const displayPrice = useMemo(() => {
    return item.displayPrice || ''
  }, [item.displayPrice])

  // Derive details line: Brand — Price only (no sizes/extra phrases)
  const details = useMemo(() => {
    const source = String(item.raw?.description || item.description || '')
    // Brand: prefer normalized meta.brand then fallback to raw.brand/make
    const brandRaw = (item.meta?.brand || (item.raw as any)?.brand || (item.raw as any)?.make || '').toString().trim()
    const brandPart = brandRaw ? brandRaw : ''

    // Price: detect price + pp/ea/each if present; else fallback to normalized displayPrice (not 'Contact for price')
    const pricePP1 = source.match(/(?:£|\$|€)\s*\d[\d,]*(?:\.\d+)?\s*(?:pp|per\s*piece|ea|each)\b/i)
    const pricePP2 = source.match(/\b(?:pp|per\s*piece|ea|each)\s*(?:of\s*)?(?:£|\$|€)\s*\d[\d,]*(?:\.\d+)?/i)
    let pricePart = (pricePP1?.[0] || pricePP2?.[0] || '').trim()
    if (!pricePart && displayPrice && !/^contact/i.test(displayPrice)) {
      pricePart = displayPrice
    }
    const pieces: (string | JSX.Element)[] = []
    if (brandPart) pieces.push(brandPart)
    if (pricePart) {
      if (pieces.length) pieces.push(' — ')
      if (loggedIn) {
        pieces.push(pricePart)
      } else {
        const stripped = pricePart.replace(/^[£$€]\s*/, '')
        pieces.push(
          <>
            <span>£</span>
            <span className="blur-[6px] select-none no-copy text-white/40" title="Login to view price">{stripped}</span>
          </>
        )
      }
    }
    return pieces.map((p, i) => <React.Fragment key={`detail-${i}`}>{p}</React.Fragment>)
  }, [item.raw?.description, item.description, displayPrice, loggedIn])

  const messageHref = useMemo(() => {
    const base = item.whatsappUrl || item.raw?.whatsapp || ''
    // console.log(item.raw.vendorId)
    if (!loggedIn) return '#'
    // Message includes the item name when available
      const name = (item.name || item.description || '').toString().trim()
      const safeName = name.replace(/\"/g, "'")
      const text = name
        ? `Referred from resellersync.io, have you still got "${safeName}" available?`
        : `Referred from resellersync.io, have you still got this available?`
    return buildWhatsAppHref(base, text)
  }, [item, loggedIn])

  useEffect(() => {
    // small timeout so the initial render has the base class, then we add the 'enter' class
    const t = setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(t)
  }, [])

const handleClick = useCallback((e: React.MouseEvent) => {
  e.preventDefault()
  if (!loggedIn) {
    onRequireAuth?.()
    return
  }
  const name = (item.name || item.description || '').toString().trim()
  onWhatsApp?.(item.raw.vendorId, name,item.id, onlogout!)
}, [item, loggedIn, onWhatsApp, onlogout])

  return (
<div
  className={
    `feed-card flex items-start gap-4 p-4 rounded-lg border border-white/10 bg-gray-900 shadow-sm relative`
    + (entered ? ' feed-card-enter' : ' feed-card-initial')
  }
>
  {/* NEW badge stays exactly like your original */}
  {isRecent && (
   <div className={`recent-badge recent-badge-float ${isWtb ? 'recent-badge-wtb recent-badge-glow-wtb' : 'recent-badge-glow'}`}>New</div>
  )}

  {/* Left: Image */}
<Link
  to={`/product/${item.id}`}
  className="relative flex-none w-24 h-24 rounded-xl overflow-hidden ios-glass flex items-center justify-center transition-transform active:scale-95"
>
  {item.images?.[0] ? (
    <img
      src={item.images[0]}
      className="absolute inset-0 w-full h-full object-cover"
      alt="Product"
    />
  ) : (
    /* This span now uses tracking and opacity to mimic iOS system labels */
    <span className="relative z-10 text-[11px] font-semibold tracking-widest text-white/40 uppercase">
      WTB
    </span>
  )}
</Link>
  {/* Right: Text */}
  <div className="flex-1 flex flex-col justify-between min-w-0">
    <Link to={`/product/${item.id}`} className="no-underline text-white">
      <div className="feed-title font-semibold text-sm" style={{
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    paddingRight: '3rem'
  }}>
    {item.name || item.description}
  </div>
  <div className="feed-meta mt-1 text-sm text-white/70 flex flex-wrap items-center gap-2">
    {details.length ? details : null}
  </div>
  {(date || time) && (
    <div className="text-xs text-white/50 mt-1">
      Posted {date}{date && time ? ' - ' : ''}{time}
    </div>
  )}
    </Link>

    {/* WhatsApp button */}
    <div className="mt-2">
      {loggedIn ? (
        <a
          href="#"
          onClick={(e) => {
            e.stopPropagation()
            handleClick(e)
          }}
          className={btnClass}
        >
          Message on WhatsApp
        </a>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRequireAuth?.()
          }}
          className={btnClass}
          title="Login or sign up to contact on WhatsApp"
        >
          Sign up to message
        </button>
      )}
    </div>
  </div>
</div>


  )
}
