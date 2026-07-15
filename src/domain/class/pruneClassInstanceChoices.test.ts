import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import { pruneClassInstanceChoicesForLevel } from '../../domain/class/pruneClassInstanceChoices'

describe('pruneClassInstanceChoicesForLevel', () => {
  it('lowers one instance without changing another', () => {
    const fighter = {
      instanceId: 'fighter-1',
      classId: 'srd-2024:fighter',
      level: 5,
      choices: {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
        'fighter-subclass': 'champion',
      },
    }
    const rogue = {
      instanceId: 'rogue-1',
      classId: 'srd-2024:rogue',
      level: 2,
      choices: {
        'fighting-style': 'archery',
      },
    }

    const prunedFighter = pruneClassInstanceChoicesForLevel(
      fighter,
      fighterSrd2024,
      1,
    )

    expect(prunedFighter.instanceId).toBe('fighter-1')
    expect(prunedFighter.level).toBe(1)
    expect(prunedFighter.choices).toEqual({
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
    })
    expect(rogue).toEqual({
      instanceId: 'rogue-1',
      classId: 'srd-2024:rogue',
      level: 2,
      choices: {
        'fighting-style': 'archery',
      },
    })
  })

  it('removes subclass choice when lowering below subclass level', () => {
    const fighter = {
      instanceId: 'fighter-1',
      classId: 'srd-2024:fighter',
      level: 5,
      choices: {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
        'fighter-subclass': 'champion',
      },
    }

    expect(
      pruneClassInstanceChoicesForLevel(fighter, fighterSrd2024, 2).choices,
    ).toEqual({
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
    })
  })
})
