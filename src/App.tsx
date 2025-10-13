import React, { useEffect, useMemo, useState } from 'react'
import localData from './data/sample.json'
import FeedCard from './components/FeedCard'
import AnimatedList from './components/AnimatedList'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'

type Item = {
  id: string
  title: string
  price: string
  image: string
  whatsapp: string
  group?: string
  time?: string
}

export default function App() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Item[]>(localData.items)
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try { const raw = localStorage.getItem('user'); return !!raw } catch { return false }
  })
  const [user, setUser] = useState<{ name: string; email?: string } | null>(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

  // Fetch initial items from backend, fallback to bundled sample.json
  useEffect(() => {
    let didCancel = false
    const tryFetch = async (url: string) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('bad')
        const payload = await res.json()
        if (!didCancel && Array.isArray(payload.items)) setItems(payload.items)
        return true
      } catch (e) {
        return false
      }
    }

    ;(async () => {
      const ok = await tryFetch('/api/items')
      if (!ok) await tryFetch('http://localhost:4000/api/items')
    })()

    return () => {
      didCancel = true
    }
  }, [])

  // Subscribe to server-sent events for new items (prepending)
  useEffect(() => {
    let es: EventSource | null = null
    ;(async () => {
      try {
        // try main endpoint first, then fallback to mock server
        const streamUrl = '/api/stream'
        const mockUrl = 'http://localhost:4000/api/stream'

        // quick connectivity probe for /api/stream
        const probe = await fetch(streamUrl, { method: 'HEAD' }).then((r) => r.ok).catch(() => false)
        const useUrl = probe ? streamUrl : mockUrl
        es = new EventSource(useUrl)
        es.onmessage = (ev) => {
          try {
            const item = JSON.parse(ev.data) as Item
            // prepend the new item — it will mount and animate via FeedCard
            setItems((prev) => {
              // avoid duplicates
              if (prev.find((p) => p.id === item.id)) return prev
              return [item, ...prev]
            })
          } catch (e) {
            // ignore malformed events
          }
        }
        es.onerror = () => {
          // server closed or errored — close and cleanup
          if (es) {
            es.close()
            es = null
          }
        }
      } catch (e) {
        // EventSource not available or connection failed — no-op
      }
    })()

    return () => {
      if (es) es.close()
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => (it.title + ' ' + (it.group ?? '')).toLowerCase().includes(q))
  }, [query, items])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100">
      <header className="max-w-3xl mx-auto py-8 text-center px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold">AI WhatsApp Sourcing Feed</h1>
            <p className="mt-1 text-gray-400">Search items posted to WhatsApp trade groups in the last 72 hours.</p>
          </div>
          <div>
            {!loggedIn ? (
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-transparent border border-gray-700 rounded" onClick={() => setLoginOpen(true)}>Log in</button>
                <button className="px-3 py-2 bg-emerald-600 rounded" onClick={() => setSignupOpen(true)}>Sign up</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-300">{user?.name}</div>
                <button className="px-3 py-2 bg-red-600 rounded" onClick={() => { setLoggedIn(false); setUser(null); try { localStorage.removeItem('user') } catch {} }}>Logout</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item, group, or price"
            className="w-80 px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <section className="space-y-4">
          {visible.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No results for "{query}"</div>
          ) : (
            <AnimatedList
              items={visible}
              renderItem={(item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  locked={!loggedIn}
                  onRequestLogin={() => setLoginOpen(true)}
                />
              )}
            />
          )}
        </section>

        <section className="mt-12 bg-gray-900/50 p-8 rounded-lg text-center cta-wrapper">
          <h2 className="text-2xl font-medium">Save time. Source faster.</h2>
          <p className="mt-2 text-gray-400">Stay updated with the latest posts from sellers in 1000+ global whatsapp communities for high end luxury fashion, streetwear, sneakers, activewear, accessories, and much more.</p>
          <button className="mt-6 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded text-white">Book Your Free Demo</button>
        </section>
      </main>

  <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={(u) => { setLoggedIn(true); setUser(u); try { localStorage.setItem('user', JSON.stringify(u)) } catch {} setLoginOpen(false) }} />
  <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} onSignup={(u) => { setLoggedIn(true); setUser(u); try { localStorage.setItem('user', JSON.stringify(u)) } catch {} setSignupOpen(false) }} />

      <footer className="mt-20 py-10 text-center text-gray-500">
        <div className="max-w-3xl mx-auto">Links · Link · Link · Link</div>
      </footer>
    </div>
  )
}
