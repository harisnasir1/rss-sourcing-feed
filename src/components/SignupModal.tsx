import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function SignupModal({ open, onClose, onSignup }: { open: boolean; onClose: () => void; onSignup: (user: { name: string; email?: string }) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  if (!open) return null
  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative modal-card p-6 w-[26rem] text-gray-100">
        <h3 className="text-xl font-medium">Sign up</h3>
        <p className="mt-2 text-sm text-gray-400">Create an account to unlock contact details.</p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSignup({ name: name || email.split('@')[0], email })
            setName(''); setEmail(''); setPassword('')
            onClose()
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="modal-input w-full px-3 py-2 text-white placeholder-gray-300" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="modal-input w-full px-3 py-2 text-white placeholder-gray-300" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="modal-input w-full px-3 py-2 text-white placeholder-gray-300" required />

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-800/70 border border-white/10">Cancel</button>
            <button type="submit" className="btn-blue px-5 py-2.5">Sign up</button>
          </div>
        </form>
      </div>
    </div>
  )
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(modal, document.body)
}
