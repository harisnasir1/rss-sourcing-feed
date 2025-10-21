// Lightweight client-side email validation: format + disposable-domain check

const DISPOSABLE_DOMAINS: string[] = [
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  '10minutemail.com', '10minutemail.net', '10minemail.com',
  'tempmail.com', 'temp-mail.org', 'tempmailo.com', 'temp-mail.io',
  'guerrillamail.com', 'sharklasers.com', 'grr.la',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'throwawaymail.com', 'moakt.com', 'maildrop.cc',
  'getnada.com', 'nada.ltd', 'dropmail.me',
  'dispostable.com', 'trashmail.com', 'mailcatch.com',
  'fakemail.net', 'linshi-email.com', 'spambog.com',
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

function getDomain(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at <= 0) return null
  return email.slice(at + 1).replace(/\.+$/, '').toLowerCase()
}

function isDisposable(domain: string): boolean {
  return DISPOSABLE_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))
}

function isLikelyIpLiteral(domain: string): boolean {
  // e.g., 127.0.0.1 or [::1]
  if (/^\[.*\]$/.test(domain)) return true
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) return true
  return false
}

export function validateEmail(email: string): { ok: boolean; reason?: string } {
  const e = (email || '').trim()
  if (!EMAIL_REGEX.test(e)) return { ok: false, reason: 'invalid-format' }
  const domain = getDomain(e)
  if (!domain) return { ok: false, reason: 'invalid-domain' }
  if (isLikelyIpLiteral(domain)) return { ok: false, reason: 'invalid-domain' }
  if (isDisposable(domain)) return { ok: false, reason: 'disposable' }
  // Looks fine
  return { ok: true }
}

export function validationMessage(result: { ok: boolean; reason?: string }): string | null {
  if (result.ok) return null
  switch (result.reason) {
    case 'disposable':
      return 'Disposable email addresses are not allowed. Please use your personal or work email.'
    case 'invalid-domain':
    case 'invalid-format':
    default:
      return 'Please enter a valid email address.'
  }
}
