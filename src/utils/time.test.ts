import { within72Hours } from './time'

describe('within72Hours', () => {
  it('accepts recent timestamps', () => {
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2h ago
    expect(within72Hours(recent)).toBe(true)
  })
  it('rejects old timestamps', () => {
    const old = new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString() // 80h ago
    expect(within72Hours(old)).toBe(false)
  })
})
