import React, { useEffect, useMemo, useState } from 'react'
import { buildWhatsAppHref } from '../utils/whatsapp'
import { Item as NormalizedItem } from '../utils/normalizeItem'

type Item = NormalizedItem

export default function FeedCard({
  item,
  loggedIn = false,
  onRequireAuth,
}: {
  item: Item
  loggedIn?: boolean
  onRequireAuth?: () => void
}) {
  const formatDate = (iso?: string) => {
    if (!iso) return { date: '', time: '' }
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    return { date, time }
  }
  const { date, time } = formatDate(item.createdAt)
  // local state used to trigger enter animation when the component mounts
  const [entered, setEntered] = useState(false)

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

  return (
    <div
      className={
        `feed-card transform-gpu transition-all duration-300 ease-out flex flex-row items-center gap-5 p-[0.625rem]`
        + (entered ? ' feed-card-enter' : ' feed-card-initial')
        + (isRecent ? ' recent-15' : '')
      }
    >
      {isRecent ? (
        <div className="recent-badge recent-badge-float recent-badge-glow">New</div>
      ) : null}
      {/* Left: Photo container */}
      <div className="flex-none rounded overflow-hidden" style={{ width: '6.3125rem', height: '6.375rem' }}>
        {item.images && item.images[0] ? (
          <img
            src={item.images[0]}
            alt={item.name || item.description}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

  {/* Right: Content column (pad-right so text doesn't sit under the floating NEW badge) */}
  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 pr-16">
  {/* Title */}
  <div className="feed-title text-animate break-words">{item.name || item.description}</div>

        {/* Details line: sizes + price PP + optional phrase */}
        <div className="feed-meta mt-1 text-animate flex flex-wrap items-center gap-2">
          {details.length ? details : null}
        </div>

        {/* Posted date/time */}
        {(date || time) ? (
          <div className="mt-1 text-xs text-white/60">Posted {date}{date && time ? ' - ' : ''}{time}</div>
        ) : null}


        <div className="mt-2">
          {loggedIn ? (
            <a
              href={messageHref}
              target="_blank"
              rel="noreferrer"
              className="btn-blue px-5 py-2.5 inline-block text-center card-btn-label"
            >
              Message on WhatsApp
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onRequireAuth?.()}
              className="btn-blue px-5 py-2.5 inline-block text-center card-btn-label"
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
