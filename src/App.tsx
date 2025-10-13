import React, { useEffect, useMemo, useState } from 'react'
// removed local sample import — items will be loaded from the external API when an API key is provided
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
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // No API key or local mock UI in production flow. Items will be loaded from the RunPod endpoint below.
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try { const raw = localStorage.getItem('user'); return !!raw } catch { return false }
  })
  const [user, setUser] = useState<{ name: string; email?: string } | null>(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

  // shared payload normalization helper (used by both runpod fetch and manual mock load)
  const looksLikeItem = (obj: any) => {
    if (!obj || typeof obj !== 'object') return false
    const keys = Object.keys(obj)
    // heuristic: must have at least one of these identifying keys
    return keys.includes('id') || keys.includes('title') || keys.includes('price') || keys.includes('image') || keys.includes('whatsapp')
  }

  const findItemsArray = (val: any, depth = 3): any[] | null => {
    if (depth < 0 || val == null) return null
    if (Array.isArray(val)) {
      // check if array elements look like items
      if (val.length > 0 && val.every((el) => typeof el === 'object' && looksLikeItem(el))) return val
      // maybe array contains nested arrays/objects — try to find inside
      for (const el of val) {
        const found = findItemsArray(el, depth - 1)
        if (found) return found
      }
      return null
    }
    if (typeof val === 'object') {
      // check common fields
      if (Array.isArray(val.items) && val.items.length > 0 && val.items.every((el: any) => typeof el === 'object')) return val.items
      if (val.data && Array.isArray(val.data.items)) return val.data.items
      if (Array.isArray(val.results)) return val.results
      // search child properties
      for (const k of Object.keys(val)) {
        try {
          const found = findItemsArray(val[k], depth - 1)
          if (found) return found
        } catch (e) {
          // ignore
        }
      }
    }
    return null
  }

  const normalizeAndSet = (payload: any) => {
    if (!payload) return false
    // quick path
    if (Array.isArray(payload) && payload.length > 0 && payload.every((el) => typeof el === 'object')) {
      setItems(payload)
      return true
    }

    // deep search for candidate array
    const found = findItemsArray(payload, 4)
    if (found && Array.isArray(found)) {
      setItems(found)
      return true
    }

    // nothing matched
    console.debug('[feed] normalizeAndSet could not find items array. payload:', payload)
    return false
  }

  // RunPod URL and optional key come from Vite env variables.
  const configuredRunpodUrl = (import.meta.env.VITE_RUNPOD_URL as string) || 'https://rmizhq2lxoty3l-4000.proxy.runpod.net/api/product/getlisting?search=Nike'
  const runpodKey = (import.meta.env.VITE_RUNPOD_KEY as string) || ''

  // Use Vite dev proxy path when running in development to avoid CORS issues.
  const isDev = import.meta.env.MODE === 'development'
  const runpodUrl = isDev ? '/api/runpod/getlisting?search=Nike' : configuredRunpodUrl

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      // If we're in dev and no configuredRunpodUrl is provided, the Vite proxy won't be active.
      // Avoid calling the proxied path which would return index.html and cause a JSON parse error.
      if (isDev && !configuredRunpodUrl) {
        setError('Dev proxy not configured. Set VITE_RUNPOD_URL in a .env.local file and restart the dev server to enable /api/runpod proxying.')
        return
      }
      const headers: Record<string, string> = {}
      if (runpodKey) {
        headers['Authorization'] = `Bearer ${runpodKey}`
        headers['x-api-key'] = runpodKey
      }
      const res = await fetch(runpodUrl, { headers })
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        setError(`Fetch failed: ${res.status} ${text}`)
        return
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // If we get HTML (index.html or error page), show a helpful message instead of trying to parse JSON.
        const body = await res.text().catch(() => '')
        const preview = body ? body.slice(0, 300) : ''
        setError('Unexpected non-JSON response from server (likely HTML). This usually means the dev proxy is not configured or the upstream returned an HTML error page.\nPreview: ' + preview)
        return
      }
      const payload = await res.json()
      const ok = normalizeAndSet(payload)
      if (!ok) setError('Unexpected response shape from server')
    } catch (e: any) {
      setError(`Network error: ${e?.message || String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => (it.title + ' ' + (it.group ?? '')).toLowerCase().includes(q))
  }, [query, items])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100">
      {/* Modern top nav with logo, centered search and actions on the right */}
      <nav className="w-full bg-gray-900/40 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/assets/rrs_logo_light.svg" alt="RRS" style={{ width: 70 }} className="w-[70px] h-auto object-contain" />
          </div>

          {/* center: logo already occupies visual center; keep nav minimal */}

          <div className="flex items-center gap-3">
            {!loggedIn ? (
              <div className="hidden md:flex gap-2">
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
      </nav>

      {/* Header + search (heading above the search, search above the feed list) */}
  <header className="max-w-3xl mx-auto py-8 text-center px-4">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-semibold">Sourcing feed</h1>
          <p className="mt-2 text-gray-400 max-w-xl">WhatsApp-style stream from verified vendors. Tap to message vendors or, if enabled, buy securely.</p>
          <div className="mt-6 w-full flex justify-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full max-w-xs sm:max-w-md px-4 py-2 rounded bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-3xl mx-auto px-4 py-4">
        <section>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-400 mb-3">{error}</div>
              <button className="px-4 py-2 bg-sky-600 rounded" onClick={() => fetchItems()}>Retry</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No results for "{query}"</div>
          ) : (
            <AnimatedList
              items={visible}
              className="space-y-3"
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
          <h2 className="text-2xl font-medium">Start Syncing Smarter Today</h2>
          <p className="mt-2 text-gray-400">Discover how ResellerSync streamlines supplier onboarding, product syncing, and payouts — all in one platform. Risk-free demo, zero commitment.</p>
          <button className="mt-6 px-6 py-2 btn-blue">Book Your Free Demo</button>
        </section>
        </div>
      </main>

  <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={(u) => { setLoggedIn(true); setUser(u); try { localStorage.setItem('user', JSON.stringify(u)) } catch {} setLoginOpen(false) }} />
  <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} onSignup={(u) => { setLoggedIn(true); setUser(u); try { localStorage.setItem('user', JSON.stringify(u)) } catch {} setSignupOpen(false) }} />

      <footer className="mt-20 py-12 text-center text-gray-400">
        <div className="max-w-3xl mx-auto">
          <img src="/assets/rrs_logo_light.svg" alt="RRS" className="mx-auto w-[70px] mb-4" />
          <div className="flex justify-center gap-6 text-sm mb-3">
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
            <a className="hover:text-white">Link</a>
          </div>
          <div className="text-xs text-gray-500">See how Resellersync your white-label consignment model risk-free.</div>
        </div>
      </footer>
    </div>
  )
}
