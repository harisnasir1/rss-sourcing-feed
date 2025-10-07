import React, { useState } from 'react'

export default function LoginModal({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: (user: { name: string; email?: string }) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold">Log in</h3>
        <p className="mt-2 text-sm text-gray-400">Enter your credentials to view contact details and message sellers.</p>

        <div className="mt-4 space-y-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
          <button onClick={() => { onLogin({ name: email.split('@')[0] || 'User', email }); setEmail(''); setPassword('') }} className="px-4 py-2 rounded bg-sky-500">Log in</button>
        </div>
      </div>
    </div>
  )
}
