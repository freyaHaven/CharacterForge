import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../content/packs/srd-2024/classes/fighter'
import type { ClassSelection } from '../../domain/class/types'
import { createAsiChoicesUpToLevel } from '../../domain/class/abilityScoreImprovement'
import { createFighterWeaponMasteryChoices } from '../../content/packs/srd-2024/classes/fighter.weaponMastery'
import { validateClassSelection } from './classRules'

function createValidFighterSelection(
  overrides: Partial<ClassSelection> = {},
): ClassSelection {
  const level = overrides.level ?? 1

  return {
    classId: 'srd-2024:fighter',
    level: 1,
    choices: {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
      ...createFighterWeaponMasteryChoices(level),
      ...createAsiChoicesUpToLevel(level),
    },
    ...overrides,
  }
}

describe('validateClassSelection', () => {
  it('accepts a complete fighter selection', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection(),
        'srd-2024',
        fighterSrd2024,
      ),
    ).toEqual({ ok: true })
  })

  it('rejects a missing class definition', () => {
    expect(
      validateClassSelection(createValidFighterSelection(), 'srd-2024', null),
    ).toEqual({ ok: false, issues: [{ code: 'class-not-found' }] })
  })

  it('rejects a class from the wrong edition', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection(),
        'srd-2014',
        fighterSrd2024,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'wrong-edition' }] })
  })

  it('requires a fighting style choice', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'skill-proficiencies': ['athletics', 'perception'],
          'weapon-mastery': createFighterWeaponMasteryChoices(1)['weapon-mastery'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'fighting-style' }],
    })
  })

  it('requires exactly two skill proficiencies', () => {
    const tooFew = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'archery',
          'skill-proficiencies': ['athletics'],
          'weapon-mastery': createFighterWeaponMasteryChoices(1)['weapon-mastery'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(tooFew).toEqual({
      ok: false,
      issues: [
        { code: 'invalid-multi-select-count', choiceId: 'skill-proficiencies' },
      ],
    })
  })

  it('requires weapon mastery selections', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'weapon-mastery' }],
    })
  })

  it('rejects an invalid weapon mastery value', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
          'weapon-mastery': 'longsword',
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'invalid-choice', choiceId: 'weapon-mastery' }],
    })
  })

  it('does not require higher-level choices at level 1', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection(),
        'srd-2024',
        fighterSrd2024,
      ),
    ).toEqual({ ok: true })
  })

  it('requires Fighter Subclass at level 3', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        level: 3,
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
          'weapon-mastery': createFighterWeaponMasteryChoices(3)['weapon-mastery'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'fighter-subclass' }],
    })
  })

  it('rejects pruned higher-level choices still present at level 1', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
          'weapon-mastery': createFighterWeaponMasteryChoices(1)['weapon-mastery'],
          'fighter-subclass': 'champion',
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'unknown-choice', choiceId: 'fighter-subclass' }],
    })
  })

  it('accepts a complete fighter selection at level 5', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection({
          level: 5,
          choices: {
            'fighting-style': 'defense',
            'skill-proficiencies': ['athletics', 'perception'],
            ...createFighterWeaponMasteryChoices(5),
            ...createAsiChoicesUpToLevel(5),
            'fighter-subclass': 'champion',
          },
        }),
        'srd-2024',
        fighterSrd2024,
      ),
    ).toEqual({ ok: true })
  })
})
