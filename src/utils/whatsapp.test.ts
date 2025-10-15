import { buildWhatsAppHref } from './whatsapp'

describe('buildWhatsAppHref', () => {
  it('adds text param when missing', () => {
    const url = 'https://api.whatsapp.com/send?phone=12345'
    const res = buildWhatsAppHref(url, 'hello world')
    expect(res).toContain('text=')
  })

  it('leaves existing text param intact', () => {
    const url = 'https://api.whatsapp.com/send?phone=12345&text=pre'
    const res = buildWhatsAppHref(url, 'hello world')
    const parsed = new URL(res)
    expect(parsed.searchParams.get('text')).toBe('pre')
  })
})
