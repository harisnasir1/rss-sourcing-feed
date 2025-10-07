import React, { useEffect, useRef, useState } from 'react'

type Item = any

export default function AnimatedList({
  items,
  renderItem,
  removeDelay = 320,
}: {
  items: Item[]
  renderItem: (item: Item) => React.ReactNode
  removeDelay?: number
}) {
  // local copy that can hold 'removing' items while they animate out
  const [local, setLocal] = useState<{ item: Item; id: string; removing?: boolean }[]>(
    items.map((it) => ({ item: it, id: String(it.id) }))
  )
  const timers = useRef<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prevRects = useRef<Record<string, DOMRect>>({})

  // FLIP: measure positions before DOM changes
  const measure = () => {
    const rects: Record<string, DOMRect> = {}
    if (!containerRef.current) return rects
    const nodes = containerRef.current.querySelectorAll<HTMLElement>('[data-id]')
    nodes.forEach((n) => {
      const id = n.getAttribute('data-id') || ''
      rects[id] = n.getBoundingClientRect()
    })
    return rects
  }

  useEffect(() => {
    // capture positions before update
    prevRects.current = measure()

    // compute next local array with removing flags
    setLocal((prev) => {
      const prevById = new Map(prev.map((p) => [p.id, p]))
      const next: { item: Item; id: string; removing?: boolean }[] = []

      for (const it of items) {
        const id = String(it.id)
        const existing = prevById.get(id)
        if (existing) {
          next.push({ ...existing, item: it })
          prevById.delete(id)
        } else {
          next.push({ item: it, id })
        }
      }

      for (const [, removed] of prevById) {
        next.push({ ...removed, removing: true })
      }

      return next
    })
  }, [items])

  // after DOM updated, perform FLIP animation
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!containerRef.current) return
      const nodes = containerRef.current.querySelectorAll<HTMLElement>('[data-id]')
      nodes.forEach((n) => {
        const id = n.getAttribute('data-id') || ''
        const prev = prevRects.current[id]
        if (!prev) return
        const next = n.getBoundingClientRect()
        const dx = prev.left - next.left
        const dy = prev.top - next.top
        if (dx || dy) {
          // apply inverse transform
          n.style.transform = `translate(${dx}px, ${dy}px)`
          n.style.transition = 'transform 0s'
          requestAnimationFrame(() => {
            n.style.transition = 'transform 300ms cubic-bezier(.2,.9,.25,1)'
            n.style.transform = ''
          })
        }
      })
    })
  }, [local])

  // watch for items that are marked removing and schedule cleanup
  useEffect(() => {
    for (const entry of local) {
      if (entry.removing && !timers.current[entry.id]) {
        const id = entry.id
        timers.current[id] = window.setTimeout(() => {
          setLocal((prev) => prev.filter((p) => p.id !== id))
          delete timers.current[id]
        }, removeDelay)
      }
    }

    return () => {
      for (const k of Object.keys(timers.current)) {
        clearTimeout(timers.current[k])
        delete timers.current[k]
      }
    }
  }, [local, removeDelay])

  return (
    <div ref={containerRef}>
      {local.map((l) => (
        <div key={l.id} data-id={l.id} className={"animated-item" + (l.removing ? ' removing' : '')}>
          {renderItem(l.item)}
        </div>
      ))}
    </div>
  )
}
