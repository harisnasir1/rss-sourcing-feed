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

  const displayPrice = useMemo(() => {
    return item.displayPrice || ''
  }, [item.displayPrice])

  const messageHref = useMemo(() => {
    const base = item.whatsappUrl || item.raw?.whatsapp || ''
    if (!loggedIn) return '#'
    const title = item.name || item.description || 'your item'
    const text = `I'm interested in ${title}. Could you tell me more?`
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
        `feed-card transform-gpu transition-all duration-300 ease-out flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:shadow-lg`
        + (entered ? ' feed-card-enter' : ' feed-card-initial')
      }
    >
      {item.images && item.images[0] ? (
        <img
          src={item.images[0]}
          alt={item.name || item.description}
          className="flex-none w-20 h-20 object-cover rounded"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        {/* Title: only show the concise item name */}
  <div className="font-medium text-animate break-words">{item.name || item.description}</div>

        {/* Price: always visible */}
        {loggedIn ? (
          <div className="text-sm text-gray-400 price">{displayPrice}</div>
        ) : (
          <div className="flex items-center gap-2">
            <svg aria-hidden viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-500"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 1 1 6 0v3Z"/></svg>
            <div
              className="text-sm text-gray-400/40 price select-none no-copy blur-[6px]"
              aria-hidden
              title="Login to view price"
              onContextMenu={(e) => e.preventDefault()}
            >
              Price locked
            </div>
          </div>
        )}

        {/* Meta: brand | date | time, shown only when unlocked */}
        {/* Meta: always visible (brand | date | time when available) */}
  <div className="text-[12px] text-gray-500 mt-1 meta text-animate">
          {item.meta?.brand ? <span className="brand">{item.meta.brand}</span> : null}
          {item.meta?.brand && item.createdAt ? <span className="mx-1">|</span> : null}
          {item.createdAt ? (
            <>
              <span className="date">{date}</span>
              <span className="mx-1">|</span>
              <span className="time">{time}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="self-end sm:self-auto">
        {loggedIn ? (
          <a
            href={messageHref}
            target="_blank"
            rel="noreferrer"
            className="btn-blue px-5 py-2.5 text-sm"
          >
            Message on WhatsApp
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onRequireAuth?.()}
            className="btn-blue px-5 py-2.5 text-sm"
            title="Login or sign up to contact on WhatsApp"
          >
            Sign up to message
          </button>
        )}
      </div>
    </div>
  )
}
