import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { selectAsiFeat } from '../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../domain/class/epicBoon'
import { createFeatGrantChoiceStorageKey } from '../../../domain/feat/featGrantChoiceStorage'
import { resolveCharacterFeatGrants } from '../resolveCharacterFeatGrants'
import type { Character } from '../../../domain/types'
import { createDefaultCharacterDetails } from '../../../domain/character/details'

function baseCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test',
    name: 'Test',
    editionId: 'srd-2024',
    targetLevel: 19,
    classes: [],
    startingClassInstanceId: null,
    species: null,
    background: null,
    feat: null,
    abilityScores: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    creationMethod: 'standard-array',
    details: createDefaultCharacterDetails(),
    equipment: { selections: [] },
    spellSourceStates: [],
    ...overrides,
  }
}

describe('resolveCharacterFeatGrants', () => {
  it('collects background, legacy character.feat, ASI, and epic boon grants', async () => {
    const resolved = await resolveCharacterFeatGrants(
      baseCharacter({
        background: {
          backgroundId: 'srd-2024:soldier',
          abilityScoreIncrease: {
            mode: 'two-and-one',
            plusTwo: 'strength',
            plusOne: 'constitution',
          },
          choices: {},
        },
        feat: { featId: 'srd-2024:alert', choices: {} },
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 19,
            choices: {
              'ability-score-improvement-4': selectAsiFeat('srd-2024:skilled'),
              'epic-boon': selectEpicBoonFeat('srd-2024:boon-of-combat-prowess'),
            },
          },
        ],
      }),
      {
        classCatalog: createBundledClassCatalog(),
        backgroundCatalog: createBundledBackgroundCatalog(),
        featCatalog: createBundledFeatCatalog(),
      },
    )

    expect(resolved.grants.map((grant) => grant.featId)).toEqual([
      'srd-2024:savage-attacker',
      'srd-2024:alert',
      'srd-2024:skilled',
      'srd-2024:boon-of-combat-prowess',
    ])
    expect(resolved.grants[0]?.source.kind).toBe('background-origin')
    expect(resolved.grants[1]?.source.kind).toBe('character-feat')
    expect(resolved.grants[2]?.source).toMatchObject({
      kind: 'class-feat-grant',
      choiceId: 'ability-score-improvement-4',
    })
    expect(resolved.grants[3]?.source).toMatchObject({
      kind: 'class-feat-grant',
      choiceId: 'epic-boon',
    })
  })

  it('populates companion nested choices on class grants', async () => {
    const storageKey = createFeatGrantChoiceStorageKey(
      'ability-score-improvement-4',
      'skill-or-tool-proficiencies',
    )
    const picks = [
      'skill:athletics',
      'skill:perception',
      'tool:thieves-tools',
    ]

    const resolved = await resolveCharacterFeatGrants(
      baseCharacter({
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 4,
            choices: {
              'ability-score-improvement-4': selectAsiFeat('srd-2024:skilled'),
              [storageKey]: picks,
            },
          },
        ],
      }),
      {
        classCatalog: createBundledClassCatalog(),
        backgroundCatalog: createBundledBackgroundCatalog(),
        featCatalog: createBundledFeatCatalog(),
      },
    )

    expect(resolved.grants).toHaveLength(1)
    expect(resolved.grants[0]?.choices).toEqual({
      'skill-or-tool-proficiencies': picks,
    })
  })
})
