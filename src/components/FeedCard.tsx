import React, { useEffect, useState } from 'react'

import { Item as NormalizedItem } from '../utils/normalizeItem'

type Item = NormalizedItem

export default function FeedCard({
  item,
}: {
  item: Item
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
        <div className="text-sm text-gray-400 price">{item.displayPrice}</div>

        {/* Meta: brand | date | time, shown only when unlocked */}
        {/* Meta: always visible (brand | date | time when available) */}
        <div className="text-xs text-gray-500 mt-1 meta text-animate">
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
        <a
          href={item.whatsappUrl || item.raw?.whatsapp || '#'}
          target="_blank"
          rel="noreferrer"
          onClick={() => { /* no gating */ }}
          className="btn-blue px-5 py-2.5 text-sm"
        >
          Message on WhatsApp
        </a>
      </div>
    </div>
  )
}
