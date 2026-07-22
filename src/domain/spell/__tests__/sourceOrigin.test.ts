import { describe, expect, it } from 'vitest'
import {
  compareSpellSourceGroupSortKeys,
  compareSpellSourceSortKeys,
  isSubclassClassChoice,
  spellSourceGroupBand,
  type SpellSourceSortKey,
} from '../sourceOrigin'

function key(
  partial: Partial<SpellSourceSortKey> & Pick<SpellSourceSortKey, 'originKind'>,
): SpellSourceSortKey {
  return {
    classInstanceIndex: -1,
    grantingLevel: 1,
    progressionOrder: 0,
    displayName: 'A',
    ...partial,
  }
}

describe('spell source origin ordering', () => {
  it('orders origin bands species → background → feat → class', () => {
    const ordered = [
      key({ originKind: 'class-core', displayName: 'Wizard' }),
      key({ originKind: 'species-trait', displayName: 'Elf' }),
      key({ originKind: 'character-feat', displayName: 'Feat' }),
      key({ originKind: 'background-origin', displayName: 'Sage' }),
    ].sort(compareSpellSourceSortKeys)

    expect(ordered.map((entry) => entry.originKind)).toEqual([
      'species-trait',
      'background-origin',
      'character-feat',
      'class-core',
    ])
  })

  it('places subclass features after class core within the same class', () => {
    const ordered = [
      key({
        originKind: 'subclass-feature',
        classInstanceIndex: 0,
        grantingLevel: 3,
        displayName: 'Domain',
      }),
      key({
        originKind: 'class-core',
        classInstanceIndex: 0,
        grantingLevel: 1,
        displayName: 'Cantrips',
      }),
      key({
        originKind: 'class-choice-option',
        classInstanceIndex: 0,
        grantingLevel: 1,
        displayName: 'Divine Order',
      }),
    ].sort(compareSpellSourceSortKeys)

    expect(ordered.map((entry) => entry.originKind)).toEqual([
      'class-core',
      'class-choice-option',
      'subclass-feature',
    ])
  })

  it('orders multiclass instances by class instance index', () => {
    const ordered = [
      key({
        originKind: 'class-core',
        classInstanceIndex: 1,
        displayName: 'Wizard',
      }),
      key({
        originKind: 'class-core',
        classInstanceIndex: 0,
        displayName: 'Cleric',
      }),
    ].sort(compareSpellSourceSortKeys)

    expect(ordered.map((entry) => entry.displayName)).toEqual([
      'Cleric',
      'Wizard',
    ])
  })

  it('uses display name as a deterministic tie-breaker', () => {
    const ordered = [
      key({ originKind: 'species-trait', displayName: 'Tiefling' }),
      key({ originKind: 'species-trait', displayName: 'Elf' }),
    ].sort(compareSpellSourceSortKeys)

    expect(ordered.map((entry) => entry.displayName)).toEqual([
      'Elf',
      'Tiefling',
    ])
  })

  it('maps origin kinds to group bands without label parsing', () => {
    expect(spellSourceGroupBand('subclass-feature')).toBe('class-instance')
    expect(spellSourceGroupBand('class-feat-grant')).toBe('class-feat-grant')
    expect(spellSourceGroupBand('species-feat-grant')).toBe('species-feat-grant')
  })

  it('orders group bands independently of resolver insertion order', () => {
    const ordered = [
      {
        band: 'class-instance' as const,
        classInstanceIndex: 0,
        grantingLevel: 1,
        progressionOrder: 0,
        displayName: 'Wizard',
      },
      {
        band: 'species-trait' as const,
        classInstanceIndex: -1,
        grantingLevel: 1,
        progressionOrder: 99,
        displayName: 'Elf',
      },
      {
        band: 'background-origin' as const,
        classInstanceIndex: -1,
        grantingLevel: 1,
        progressionOrder: 50,
        displayName: 'Magic Initiate',
      },
    ].sort(compareSpellSourceGroupSortKeys)

    expect(ordered.map((entry) => entry.band)).toEqual([
      'species-trait',
      'background-origin',
      'class-instance',
    ])
  })

  it('detects subclass choices via role or id convention', () => {
    expect(isSubclassClassChoice({ id: 'wizard-subclass' })).toBe(true)
    expect(
      isSubclassClassChoice({ id: 'custom-path', role: 'subclass' }),
    ).toBe(true)
    expect(isSubclassClassChoice({ id: 'divine-order' })).toBe(false)
  })
})
