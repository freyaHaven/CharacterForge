import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from './choiceAvailability'

describe('choiceAvailability', () => {
  it('returns only choices at or below the selected level', () => {
    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['fighting-style', 'skill-proficiencies', 'weapon-mastery'])

    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'fighting-style',
      'skill-proficiencies',
      'weapon-mastery',
      'fighter-subclass',
    ])
  })

  it('prunes choices that are no longer available while preserving others', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'fighting-style': 'archery',
        'skill-proficiencies': ['athletics', 'perception'],
        'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
        'fighter-subclass': 'champion',
      },
      getChoicesAvailableAtLevel(fighterSrd2024, 1),
    )

    expect(pruned).toEqual({
      'fighting-style': 'archery',
      'skill-proficiencies': ['athletics', 'perception'],
      'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
    })
  })
})
