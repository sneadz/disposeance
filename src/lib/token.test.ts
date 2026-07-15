import { describe, it, expect } from 'vitest'
import { canSpendToken } from './token'

describe('canSpendToken', () => {
  it('dispo si autorisé et pas encore dépensé', () => {
    expect(canSpendToken({ canUseToken: true, alreadySpentThisQuarter: false })).toBe(true)
  })
  it('indispo si déjà dépensé ce trimestre', () => {
    expect(canSpendToken({ canUseToken: true, alreadySpentThisQuarter: true })).toBe(false)
  })
  it('indispo si non autorisé', () => {
    expect(canSpendToken({ canUseToken: false, alreadySpentThisQuarter: false })).toBe(false)
  })
})
