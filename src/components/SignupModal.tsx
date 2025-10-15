import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

export default function SignupModal({ open, onClose, onSignup, onSwitch }: { open: boolean; onClose: () => void; onSignup: (user: { name: string; email?: string }) => void; onSwitch?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = { name: name || email.split('@')[0], email }
      onSignup(user)
    } catch (err) {
      console.error('[SignupModal] onSignup threw', err)
      return
    }
    setName('')
    setEmail('')
    setPassword('')
    try { onClose() } catch (err) { console.error('[SignupModal] onClose threw', err) }
  }

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div ref={backdropRef} className="absolute inset-0 bg-black/40 modal-backdrop" onClick={() => animateOut(() => onClose())} />
      <div ref={cardRef} className="relative modal-card p-6 w-full max-w-md text-gray-100">
        <h3 className="text-xl font-medium">Sign up</h3>
        <p className="mt-2 text-sm text-gray-400">Create an account to unlock contact details.</p>
        <div className="mt-2 text-sm text-emerald-300">It's completely free — create an account to message sellers.</div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
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

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => animateOut(() => onClose())} className="px-4 py-2 rounded bg-gray-800/70 border border-white/10">Cancel</button>
            <button type="submit" className="btn-blue px-5 py-2.5">Sign up</button>
          </div>
        </form>
  <div className="mt-4 text-sm text-gray-400">Already have an account? <button type="button" onClick={() => animateOut(() => onSwitch?.())} className="text-sky-300 underline">Log in</button></div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
