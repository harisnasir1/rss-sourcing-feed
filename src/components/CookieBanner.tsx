import React, { useEffect, useState } from 'react'

type Consent = {
  necessary: true
  analytics: boolean
  marketing: boolean
}

const LS_KEY = 'cookie_consent_v1'

function getStored(): Consent | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const val = JSON.parse(raw)
    if (typeof val === 'object' && val) {
      return {
        necessary: true,
        analytics: !!val.analytics,
        marketing: !!val.marketing,
      }
    }
  } catch {}
  return null
}

function setStored(c: Consent) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)) } catch {}
  try {
    document.documentElement.dataset.analytics = c.analytics ? 'on' : 'off'
    document.documentElement.dataset.marketing = c.marketing ? 'on' : 'off'
  } catch {}
}

export function openCookieManager() {
  const ev = new CustomEvent('open-cookie-manager')
  window.dispatchEvent(ev)
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = getStored()
    const url = new URL(window.location.href)
    const wantsManage = url.searchParams.get('manageCookies') === '1' || url.hash === '#cookies'
    if (existing) {
      setStored(existing)
      setOpen(!!wantsManage)
    } else {
      setOpen(true)
    }
    if (wantsManage) {
      try {
        url.searchParams.delete('manageCookies')
        if (url.hash === '#cookies') url.hash = ''
        window.history.replaceState({}, '', url.toString())
      } catch {}
    }
  }, [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('open-cookie-manager', onOpen as any)
    return () => window.removeEventListener('open-cookie-manager', onOpen as any)
  }, [])

  const acceptAll = () => {
    const c: Consent = { necessary: true, analytics: true, marketing: true }
    setStored(c)
    setAnalytics(true)
    setMarketing(true)
    setOpen(false)
  }

  const rejectAll = () => {
    const c: Consent = { necessary: true, analytics: false, marketing: false }
    setStored(c)
    setAnalytics(false)
    setMarketing(false)
    setOpen(false)
  }

  const save = () => {
    const c: Consent = { necessary: true, analytics, marketing }
    setStored(c)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000]">
      <div className="mx-auto max-w-3xl m-4 rounded-xl border border-white/10 bg-gradient-to-b from-black/70 to-gray-900/80 backdrop-blur px-4 py-4 text-sm text-gray-200 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <div className="font-medium text-white">Cookies on this site</div>
            <p className="text-gray-300 mt-1">
              We use necessary cookies to make the site work. We’d also like to use analytics and marketing cookies to help us improve and
              promote the service. You can change your choices at any time.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <input type="checkbox" checked readOnly className="mt-1" />
                <div>
                  <div className="text-white">Necessary</div>
                  <div className="text-gray-400 text-xs">Required for core functionality. Always on.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
                <div>
                  <div className="text-white">Analytics</div>
                  <div className="text-gray-400 text-xs">Helps us understand usage. Optional.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
                <div>
                  <div className="text-white">Marketing</div>
                  <div className="text-gray-400 text-xs">Used to personalize offers. Optional.</div>
                </div>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 md:w-48">
            <button className="px-4 py-2 border border-gray-700 hover:bg-gray-800" onClick={rejectAll}>Reject all</button>
            <button className="px-4 py-2 border border-gray-700 hover:bg-gray-800" onClick={save}>Save choices</button>
            <button className="px-4 py-2 btn-blue" onClick={acceptAll}>Accept all</button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Read our <a className="underline hover:text-white" href="/cookies.html">Cookie Policy</a>.
        </div>
      </div>
    </div>
  )
}
