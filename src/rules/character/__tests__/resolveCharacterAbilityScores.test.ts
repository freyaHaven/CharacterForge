import { describe, expect, it } from 'vitest'
import { soldierSrd2024 } from '../../../content/packs/srd-2024/backgrounds/soldier'
import { abilityScoreImprovementSrd2024 } from '../../../content/packs/srd-2024/feats/ability-score-improvement'
import {
  ABILITY_SCORE_IMPROVEMENT_FEAT_ID,
  ASI_FEAT_SCORE_CHOICE_ID,
} from '../../../domain/class/epicBoon'
import { createFeatGrantChoiceStorageKey } from '../../../domain/feat/featGrantChoiceStorage'
import { resolveCharacterAbilityScores } from '../resolveCharacterAbilityScores'

describe('resolveCharacterAbilityScores', () => {
  it('returns base scores when no background or ASI bonuses apply', () => {
    const baseScores = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    }

    expect(
      resolveCharacterAbilityScores({
        baseScores,
      }),
    ).toEqual(baseScores)
  })

  it('stacks background ASI onto base scores', () => {
    const totals = resolveCharacterAbilityScores({
      baseScores: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
      backgroundDefinition: soldierSrd2024,
      backgroundSelection: {
        backgroundId: soldierSrd2024.id,
        abilityScoreIncrease: {
          mode: 'two-and-one',
          plusTwo: 'strength',
          plusOne: 'constitution',
        },
        choices: {},
      },
    })

    expect(totals.strength).toBe(17)
    expect(totals.constitution).toBe(14)
    expect(totals.dexterity).toBe(14)
  })

  it('stacks completed class ASI choices', () => {
    const totals = resolveCharacterAbilityScores({
      baseScores: {
        strength: 13,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      },
      classes: [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {
            'ability-score-improvement-4': 'plus-2:dexterity',
          },
        },
      ],
    })

    expect(totals.dexterity).toBe(14)
    expect(totals.strength).toBe(13)
  })

  it('stacks nested ASI-feat score picks from companion keys', () => {
    const storageKey = createFeatGrantChoiceStorageKey(
      'epic-boon',
      ASI_FEAT_SCORE_CHOICE_ID,
    )

    const totals = resolveCharacterAbilityScores({
      baseScores: {
        strength: 13,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      },
      classes: [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 19,
          choices: {
            'epic-boon': `feat:${ABILITY_SCORE_IMPROVEMENT_FEAT_ID}`,
            [storageKey]: 'plus-2:strength',
          },
        },
      ],
      featById: new Map([
        [abilityScoreImprovementSrd2024.id, abilityScoreImprovementSrd2024],
      ]),
    })

    expect(totals.strength).toBe(15)
  })
})
