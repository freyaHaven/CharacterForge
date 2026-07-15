import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import type { ClassDefinition } from '../../domain/class/types'
import { createDeferredRequirementKey } from '../../features/class/classChoiceStateKeys'
import { resolveDeferredRequirementsForInstances } from './resolveCharacterDeferredRequirements'

const rogueFixture: ClassDefinition = {
  id: 'srd-2024:rogue',
  editionId: 'srd-2024',
  name: 'Rogue',
  description: 'Test rogue fixture',
  source: fighterSrd2024.source,
  hitDie: { sides: 8 },
  primaryAbilities: ['dexterity'],
  savingThrows: ['dexterity', 'intelligence'],
  proficiencies: {
    armor: ['light'],
    weapons: ['simple'],
    tools: [],
    skillOptions: ['stealth'],
  },
  featureProgression: [],
  choices: [],
  deferredRequirements: [
    {
      id: 'ability-score-improvement-4',
      level: 4,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the rogue level 4 Ability Score Improvement or feat',
    },
  ],
}

function getDefinition(classId: string): ClassDefinition | null {
  if (classId === 'srd-2024:fighter') {
    return fighterSrd2024
  }

  if (classId === 'srd-2024:rogue') {
    return rogueFixture
  }

  return null
}

describe('resolveDeferredRequirementsForInstances', () => {
  it('includes ownership metadata for each requirement', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const abilityScoreImprovement = resolved.find(
      (entry) => entry.requirementId === 'ability-score-improvement-4',
    )

    expect(abilityScoreImprovement).toEqual(
      expect.objectContaining({
        requirementId: 'ability-score-improvement-4',
        sourceInstanceId: 'fighter-1',
        sourceClassId: 'srd-2024:fighter',
        sourceClassLevel: 4,
        destinationStep: 'ability-scores',
      }),
    )
  })

  it('keeps duplicate raw requirement ids distinct across instances', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {},
        },
        {
          instanceId: 'rogue-1',
          classId: 'srd-2024:rogue',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const fighterAsi = resolved.find(
      (entry) =>
        entry.sourceInstanceId === 'fighter-1' &&
        entry.requirementId === 'ability-score-improvement-4',
    )
    const rogueAsi = resolved.find(
      (entry) =>
        entry.sourceInstanceId === 'rogue-1' &&
        entry.requirementId === 'ability-score-improvement-4',
    )

    expect(fighterAsi).toBeDefined()
    expect(rogueAsi).toBeDefined()
    expect(
      createDeferredRequirementKey(
        fighterAsi!.sourceInstanceId,
        fighterAsi!.requirementId,
      ),
    ).not.toBe(
      createDeferredRequirementKey(
        rogueAsi!.sourceInstanceId,
        rogueAsi!.requirementId,
      ),
    )
  })

  it('collapses weapon mastery tiers independently per instance', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 16,
          choices: {},
        },
        {
          instanceId: 'fighter-2',
          classId: 'srd-2024:fighter',
          level: 10,
          choices: {},
        },
      ],
      getDefinition,
    )

    const fighterOneMastery = resolved.filter(
      (requirement) =>
        requirement.sourceInstanceId === 'fighter-1' &&
        requirement.label === 'Weapon Mastery',
    )
    const fighterTwoMastery = resolved.filter(
      (requirement) =>
        requirement.sourceInstanceId === 'fighter-2' &&
        requirement.label === 'Weapon Mastery',
    )

    expect(fighterOneMastery).toHaveLength(1)
    expect(fighterOneMastery[0]?.description).toBe(
      'Choose 6 Weapon Masteries in Equipment',
    )
    expect(fighterTwoMastery).toHaveLength(1)
    expect(fighterTwoMastery[0]?.description).toBe(
      'Choose 5 Weapon Masteries in Equipment',
    )
  })

  it('orders requirements by class array order, level, and definition order', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'rogue-1',
          classId: 'srd-2024:rogue',
          level: 4,
          choices: {},
        },
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const firstRogueIndex = resolved.findIndex(
      (entry) => entry.sourceInstanceId === 'rogue-1',
    )
    const firstFighterIndex = resolved.findIndex(
      (entry) => entry.sourceInstanceId === 'fighter-1',
    )

    expect(firstRogueIndex).toBeGreaterThanOrEqual(0)
    expect(firstFighterIndex).toBeGreaterThan(firstRogueIndex)
  })

  it('matches single-fighter deferred output aside from ownership metadata', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ],
      getDefinition,
    )

    expect(resolved.map((entry) => entry.description)).toEqual([
      'Choose starting equipment in Equipment',
      'Choose 3 Weapon Masteries in Equipment',
    ])
  })
})
