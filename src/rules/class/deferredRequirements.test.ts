import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import { resolveDeferredCharacterRequirements } from './deferredRequirements'

describe('resolveDeferredCharacterRequirements', () => {
  it('returns only the latest weapon mastery requirement for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 16)
        .filter((requirement) => requirement.label === 'Weapon Mastery')
        .map((requirement) => requirement.description),
    ).toEqual(['Choose 6 Weapon Masteries in Equipment'])
  })
})
