import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import { resolveDeferredCharacterRequirements } from './deferredRequirements'

describe('resolveDeferredCharacterRequirements', () => {
  it('does not defer weapon mastery after it moves to the class step', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 16).filter(
        (requirement) => requirement.label === 'Weapon Mastery',
      ),
    ).toEqual([])
  })

  it('still defers starting equipment at level 1 and epic boon at 19', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 1).map(
        (requirement) => requirement.id,
      ),
    ).toEqual(['starting-equipment'])
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 19).map(
        (requirement) => requirement.id,
      ),
    ).toEqual(['starting-equipment', 'epic-boon-19'])
  })

  it('does not defer ability score improvements after they move to the class step', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 16).filter(
        (requirement) => requirement.label === 'Ability Score Improvement',
      ),
    ).toEqual([])
  })
})
