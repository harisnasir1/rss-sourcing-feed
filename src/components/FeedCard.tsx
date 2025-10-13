import React, { useEffect, useState } from 'react'

type Item = {
  id: string
  title: string
  price: string
  image: string
  whatsapp: string
  group?: string
  time?: string
}

export default function FeedCard({
  item,
  locked = false,
  onRequestLogin,
}: {
  item: Item
  locked?: boolean
  onRequestLogin?: () => void
}) {
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
        `feed-card transform-gpu transition-all duration-300 ease-out flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-900/40 p-4 rounded-lg border border-gray-800 hover:shadow-lg hover:bg-gray-900`
        + (entered ? ' feed-card-enter' : ' feed-card-initial')
      }
    >
      {item.image && item.image !== '/assets/placeholder_img.png' ? (
        <img src={item.image} alt={item.title} className="flex-none w-20 h-20 object-cover rounded" />
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-animate break-words">{item.title}</div>
        <div className={"text-sm text-gray-400 price" + (locked ? ' locked-blur' : '')}>{item.price}</div>
        <div className="text-xs text-gray-500 mt-1 meta text-animate">{item.group}  {item.time}</div>
      </div>
      <div className="self-end sm:self-auto">
        <a
          href={item.whatsapp}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (locked) {
              e.preventDefault()
              onRequestLogin?.()
            }
          }}
          className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded text-sm"
        >
          Message on WhatsApp
        </a>
      </div>
    </div>
  )
}
