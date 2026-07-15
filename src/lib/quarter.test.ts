import { describe, it, expect } from 'vitest'
import { currentQuarter } from './quarter'

describe('currentQuarter', () => {
  it('Q1 pour janvier–mars', () => {
    expect(currentQuarter(new Date('2026-01-01T00:00:00Z'))).toBe('2026-Q1')
    expect(currentQuarter(new Date('2026-03-31T23:59:59Z'))).toBe('2026-Q1')
  })
  it('Q2 pour avril–juin', () => {
    expect(currentQuarter(new Date('2026-04-01T00:00:00Z'))).toBe('2026-Q2')
    expect(currentQuarter(new Date('2026-06-30T00:00:00Z'))).toBe('2026-Q2')
  })
  it('Q3 pour juillet–septembre', () => {
    expect(currentQuarter(new Date('2026-07-15T00:00:00Z'))).toBe('2026-Q3')
  })
  it('Q4 pour octobre–décembre', () => {
    expect(currentQuarter(new Date('2026-12-31T00:00:00Z'))).toBe('2026-Q4')
  })
})
