import { describe, expect, it } from 'vitest'
import { evokerSrd2024 } from '../evoker'

describe('evokerSrd2024', () => {
  it('uses stable ids linked to Wizard', () => {
    expect(evokerSrd2024.id).toBe('srd-2024:evoker')
    expect(evokerSrd2024.classId).toBe('srd-2024:wizard')
    expect(evokerSrd2024.choiceOptionId).toBe('evoker')
  })

  it('grants Evoker features at the expected levels', () => {
    expect(evokerSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 3, 6, 10, 14,
    ])
  })

  it('attaches Evocation Savant spellbook entitlements', () => {
    const savant = evokerSrd2024.features.find(
      (feature) => feature.id === 'evocation-savant',
    )
    const entitlements = savant?.spellEntitlements ?? []
    expect(entitlements.some((entry) => entry.id === 'evocation-savant-initial')).toBe(
      true,
    )
    expect(
      entitlements.filter((entry) =>
        entry.id.startsWith('evocation-savant-slot-'),
      ),
    ).toHaveLength(8)

    const initial = entitlements.find(
      (entry) => entry.id === 'evocation-savant-initial',
    )
    expect(initial?.kind === 'select' ? initial.schools : undefined).toEqual([
      'Evocation',
    ])
    expect(
      initial?.kind === 'select' ? initial.selectionKind : undefined,
    ).toBe('spellbook')
  })
})
