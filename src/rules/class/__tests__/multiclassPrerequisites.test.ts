import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { rogueSrd2024 } from '../../../content/packs/srd-2024/classes/rogue'
import { monkSrd2024 } from '../../../content/packs/srd-2024/classes/monk'
import { createFighterWeaponMasteryChoices } from '../../../content/packs/srd-2024/classes/fighter.weaponMastery'
import { createRogueWeaponMasteryChoices } from '../../../content/packs/srd-2024/classes/rogue.weaponMastery'
import type { AbilityScores } from '../../../domain/types'
import { validateCharacterClassesWithDefinitions } from '../validateCharacterClasses'
import {
  evaluateMulticlassAbilityPrerequisites,
  meetsMulticlassPrerequisite,
} from '../multiclassPrerequisites'

const BASE_SCORES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

function getDefinition(classId: string) {
  if (classId === fighterSrd2024.id) return fighterSrd2024
  if (classId === rogueSrd2024.id) return rogueSrd2024
  if (classId === monkSrd2024.id) return monkSrd2024
  return null
}

describe('multiclass ability prerequisites', () => {
  it('does not apply when only one class is selected', () => {
    const issues = evaluateMulticlassAbilityPrerequisites(
      [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 3,
          choices: {},
        },
      ],
      getDefinition,
      BASE_SCORES,
    )

    expect(issues).toEqual([])
  })

  it('accepts Fighter any-of when Strength or Dexterity is 13+', () => {
    expect(
      meetsMulticlassPrerequisite(fighterSrd2024.multiclassPrerequisite, {
        ...BASE_SCORES,
        strength: 13,
      }),
    ).toBe(true)
    expect(
      meetsMulticlassPrerequisite(fighterSrd2024.multiclassPrerequisite, {
        ...BASE_SCORES,
        dexterity: 13,
      }),
    ).toBe(true)
    expect(
      meetsMulticlassPrerequisite(
        fighterSrd2024.multiclassPrerequisite,
        BASE_SCORES,
      ),
    ).toBe(false)
  })

  it('requires Monk all-of Dexterity and Wisdom 13+', () => {
    expect(
      meetsMulticlassPrerequisite(monkSrd2024.multiclassPrerequisite, {
        ...BASE_SCORES,
        dexterity: 13,
        wisdom: 12,
      }),
    ).toBe(false)
    expect(
      meetsMulticlassPrerequisite(monkSrd2024.multiclassPrerequisite, {
        ...BASE_SCORES,
        dexterity: 13,
        wisdom: 13,
      }),
    ).toBe(true)
  })

  it('marks Fighter/Rogue incomplete when scores miss prerequisites', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: fighterSrd2024.id,
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
              ...createFighterWeaponMasteryChoices(3),
              'fighter-subclass': 'champion',
            },
          },
          {
            instanceId: 'rogue-1',
            classId: rogueSrd2024.id,
            level: 2,
            choices: {
              'skill-proficiencies': [
                'stealth',
                'sleight-of-hand',
                'investigation',
                'athletics',
              ],
              expertise: ['stealth', 'sleight-of-hand'],
              ...createRogueWeaponMasteryChoices(2),
            },
          },
        ],
        targetLevel: 5,
        editionId: 'srd-2024',
        startingClassInstanceId: 'fighter-1',
        abilityScores: {
          ...BASE_SCORES,
          strength: 15,
          dexterity: 12,
        },
      },
      getDefinition,
    )

    expect(result.status).toBe('incomplete')
    expect(
      result.issues.filter(
        (issue) => issue.code === 'multiclass-ability-prerequisite',
      ),
    ).toHaveLength(1)
    expect(result.issues[0]?.sourceClassId).toBe(rogueSrd2024.id)
  })

  it('accepts Fighter/Rogue when Dexterity reaches 13', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: fighterSrd2024.id,
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
              ...createFighterWeaponMasteryChoices(3),
              'fighter-subclass': 'champion',
            },
          },
          {
            instanceId: 'rogue-1',
            classId: rogueSrd2024.id,
            level: 2,
            choices: {
              'skill-proficiencies': [
                'stealth',
                'sleight-of-hand',
                'investigation',
                'athletics',
              ],
              expertise: ['stealth', 'sleight-of-hand'],
              ...createRogueWeaponMasteryChoices(2),
            },
          },
        ],
        targetLevel: 5,
        editionId: 'srd-2024',
        startingClassInstanceId: 'fighter-1',
        abilityScores: {
          ...BASE_SCORES,
          strength: 15,
          dexterity: 13,
        },
      },
      getDefinition,
    )

    expect(
      result.issues.filter(
        (issue) => issue.code === 'multiclass-ability-prerequisite',
      ),
    ).toEqual([])
  })
})
