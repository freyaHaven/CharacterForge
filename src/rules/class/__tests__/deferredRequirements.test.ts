import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { resolveDeferredCharacterRequirements } from '../deferredRequirements'

describe('resolveDeferredCharacterRequirements', () => {
  it('does not defer weapon mastery after it moves to the class step', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 16).filter(
        (requirement) => requirement.label === 'Weapon Mastery',
      ),
    ).toEqual([])
  })

  it('still defers starting equipment at level 1', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 1).map(
        (requirement) => requirement.id,
      ),
    ).toEqual(['starting-equipment'])
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 19).map(
        (requirement) => requirement.id,
      ),
    ).toEqual(['starting-equipment'])
  })

  it('does not defer ability score improvements after they move to the class step', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 16).filter(
        (requirement) => requirement.label === 'Ability Score Improvement',
      ),
    ).toEqual([])
  })
})
