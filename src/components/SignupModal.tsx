import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { validateEmail, validationMessage } from '../utils/validateEmail'

type NewUser = {
  name: string
  email?: string
  hasWebsite: boolean
  hasInventory: boolean
  inventoryValueBand?: string
}

export default function SignupModal({ open, onClose, onSignup, onSwitch }: { open: boolean; onClose: () => void; onSignup: (user: NewUser) => void; onSwitch?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [hasWebsite, setHasWebsite] = useState<null | boolean>(null)
  const [hasInventory, setHasInventory] = useState<null | boolean>(null)
  const [inventoryBand, setInventoryBand] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hp, setHp] = useState('') // honeypot
  const startRef = useRef<number>(Date.now()) // dwell-time bot check
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    // reset dwell timer when opening
    startRef.current = Date.now()
    const ctx = gsap.context(() => {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' })
      gsap.fromTo(cardRef.current, { opacity: 0, y: 8, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out' })
      gsap.fromTo(cardRef.current?.querySelectorAll('input,button'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.36, stagger: 0.04, delay: 0.06 })
    })
    return () => ctx.revert()
  }, [open])

  const animateOut = (cb?: () => void) => {
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.to(cardRef.current, { opacity: 0, y: -6, filter: 'blur(6px)', duration: 0.22 })
      tl.to(backdropRef.current, { opacity: 0, duration: 0.18 }, '<')
      tl.eventCallback('onComplete', () => cb?.())
    } catch (err) {
      cb?.()
    }
  }

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Honeypot: bots tend to fill hidden fields
    if (hp && hp.trim().length > 0) {
      setFormError('Something went wrong, please try again.')
      return
    }
    // Dwell-time check: too-fast submissions are suspicious
    if (Date.now() - startRef.current < 1200) {
      setFormError('Please wait a moment and try again.')
      return
    }
    // Basic validation for required fields
    if (!name || !email || !password) {
      setFormError('Please fill in your name, email and password.')
      return
    }
    const emailCheck = validateEmail(email)
    if (!emailCheck.ok) {
      setFormError(validationMessage(emailCheck))
      return
    }
    if (hasWebsite == null) {
      setFormError('Please answer if you have a website.')
      return
    }
    if (hasInventory == null) {
      setFormError('Please answer if you have inventory.')
      return
    }
    if (hasInventory === true && !inventoryBand) {
      setFormError('Please select your inventory value.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      const base = import.meta.env.DEV
        ? '/api/users'
        : 'https://rmizhq2lxoty3l-4000.proxy.runpod.net/api/users'
      const payload = {
        fullname: name,
        email,
        password,
        have_site: hasWebsite ? 1 : 0,
        have_stock: hasInventory ? 1 : 0,
        inventory_value: hasInventory ? inventoryBand : '',
      }
      const res = await fetch(`${base}/Register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (data && data.ghl === false) {
        const msg = data.message || 'Please complete the onboarding form first.'
        try { window.open('https://forms.gle/Na1yHnniRvA2rbYu7', '_blank', 'noopener'); } catch {}
        setFormError(String(msg))
        return
      }

      if (!res.ok || !data || data.success !== true) {
        const msg = (data && (data.message || data.error)) || `Signup unsuccessful`
        setFormError(String(msg))
        return
      }
      const profile = data.data || {}
      const effectiveName = profile.fullname || name || (email.split('@')[0])
      const user: NewUser = {
        name: effectiveName,
        email: profile.email || email,
        hasWebsite: !!hasWebsite,
        hasInventory: !!hasInventory,
        inventoryValueBand: hasInventory ? inventoryBand : undefined,
      }
      onSignup(user)
      setName('')
      setEmail('')
      setPassword('')
      setHasWebsite(null)
      setHasInventory(null)
      setInventoryBand('')
      setHp('')
      try { onClose() } catch {}
    } catch (err: any) {
      console.error('[SignupModal] signup error', err)
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
  <div ref={backdropRef} className="absolute inset-0 bg-black/40 modal-backdrop" onClick={() => animateOut(() => onClose())} />
  <div ref={cardRef} className="relative modal-card w-full max-w-md text-gray-100">
        <button
          type="button"
          aria-label="Close"
          className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 border border-white/10 hover:bg-white/5"
          onClick={() => animateOut(() => onClose())}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
  <h3 className="headline-gradient">Sign up</h3>
  <p className="mt-2 text-sm text-gray-400">Create an account to unlock contact details.</p>
  <div className="mt-2 text-sm text-sky-300">It's completely free — create an account to message sellers.</div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {/* Honeypot field (off-screen) */}
          <div aria-hidden style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label>Website</label>
            <input value={hp} onChange={(e) => setHp(e.target.value)} autoComplete="off" tabIndex={-1} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="modal-input w-full" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" className="modal-input w-full" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="modal-input w-full" required />
          </div>

          {/* Required: Do you have a website? */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Do you have a website?</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Do you have a website?">
              {[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ].map(opt => (
                <button
                  type="button"
                  key={String(opt.value)}
                  role="radio"
                  aria-checked={hasWebsite === opt.value}
                  className="brand-pill"
                  onClick={() => setHasWebsite(opt.value as boolean)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Required: Do you have inventory? */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Do you have inventory?</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Do you have inventory?">
              {[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ].map(opt => (
                <button
                  type="button"
                  key={String(opt.value)}
                  role="radio"
                  aria-checked={hasInventory === opt.value}
                  className="brand-pill"
                  onClick={() => setHasInventory(opt.value as boolean)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Inventory value band (required when hasInventory = Yes) */}
          {hasInventory === true && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">How much in value of inventory do you have? (cost)</label>
              <div className="flex flex-wrap gap-2 text-sm" role="radiogroup" aria-label="Inventory value">
                {['£0–£2499','£2500–£4999','£5000–£9999','£10,000+'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={inventoryBand === opt}
                    className="brand-pill"
                    onClick={() => setInventoryBand(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formError && <div className="text-sm text-red-400">{formError}</div>}

          <div className="pt-2 flex justify-end gap-2">
            <button type="submit" className="btn-blue px-5 py-2.5 disabled:opacity-60" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </div>
        </form>
  <div className="mt-4 text-sm text-gray-400">Already have an account? <button type="button" onClick={() => animateOut(() => onSwitch?.())} className="text-sm font-normal text-sky-300 hover:underline focus:underline">Log in</button></div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
