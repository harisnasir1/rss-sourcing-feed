import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { validateEmail, validationMessage } from '../utils/validateEmail'

export default function LoginModal({ open, onClose, onLogin, onSwitch }: { open: boolean; onClose: () => void; onLogin: (user: { name: string; email?: string }) => void; onSwitch?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [hp, setHp] = useState('') // honeypot
  const startRef = useRef<number>(Date.now())
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
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
      // fallback: call immediately
      cb?.()
    }
  }
  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hp && hp.trim().length > 0) {
      setFormError('Something went wrong, please try again.')
      return
    }
    if (Date.now() - startRef.current < 900) {
      setFormError('Please wait a moment and try again.')
      return
    }
    const emailCheck = validateEmail(email)
    if (!emailCheck.ok) {
      setFormError(validationMessage(emailCheck))
      return
    }
    try {
      const user = { name: email.split('@')[0] || 'User', email }
      onLogin(user)
    } catch (err) {
      console.error('[LoginModal] onLogin threw', err)
      return
    }
    setEmail('')
    setPassword('')
    setFormError(null)
    try { onClose() } catch (err) { console.error('[LoginModal] onClose threw', err) }
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
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
  <h3 className="headline-gradient">Log in</h3>
        <p className="mt-2 text-sm text-gray-400">Enter your credentials to view contact details and message sellers.</p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {/* Honeypot field (off-screen) */}
          <div aria-hidden style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label>Website</label>
            <input value={hp} onChange={(e) => setHp(e.target.value)} autoComplete="off" tabIndex={-1} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" className="modal-input w-full" required />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="modal-input w-full" required />
          </div>

          {formError && <div className="text-sm text-red-400">{formError}</div>}

          <div className="pt-2 flex justify-end gap-2">
            <button type="submit" className="btn-blue px-5 py-2.5">Log in</button>
          </div>
        </form>
  <div className="mt-4 text-sm text-gray-400">Don't have an account? <button type="button" onClick={() => animateOut(() => onSwitch?.())} className="text-sm font-normal text-sky-300 hover:underline focus:underline">Sign up</button></div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
