import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createAsiScoreIncreaseChoice } from '../../../domain/feat/asiScoreIncreaseChoice'
import { createFeatGrantChoiceStorageKey } from '../../../domain/feat/featGrantChoiceStorage'
import { selectAsiPlus1 } from '../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../domain/class/epicBoon'
import type { FeatDefinition } from '../../../domain/feat/types'
import { validateFeatDefinitionChoices } from '../../../domain/feat/validateFeatChoices'
import { evaluateFeatEligibility } from '../../../domain/feat/eligibility'
import {
  resolveCharacterFeatEffects,
  resolveResistancesFromFeatEffects,
  resolveSensesFromFeatEffects,
} from '../../feat/resolveFeatEffects'
import { resolveCharacterAbilityScores } from '../resolveCharacterAbilityScores'
import { SRD_2024_SOURCE } from '../../../content/packs/srd-2024/source'

const SYNTHETIC_SOURCE = {
  ...SRD_2024_SOURCE,
  id: 'test-pack',
  name: 'Test Pack',
}

describe('P2.11 SRD feats', () => {
  it('bundles all 15 checklist feats plus Skilled and Grappler', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const ids = new Set(feats.map((feat) => feat.id))

    for (const id of [
      'srd-2024:alert',
      'srd-2024:magic-initiate-cleric',
      'srd-2024:magic-initiate-druid',
      'srd-2024:magic-initiate-wizard',
      'srd-2024:savage-attacker',
      'srd-2024:ability-score-improvement',
      'srd-2024:archery',
      'srd-2024:defense',
      'srd-2024:great-weapon-fighting',
      'srd-2024:two-weapon-fighting',
      'srd-2024:boon-of-combat-prowess',
      'srd-2024:boon-of-dimensional-travel',
      'srd-2024:boon-of-fate',
      'srd-2024:boon-of-irresistible-offense',
      'srd-2024:boon-of-the-night-spirit',
      'srd-2024:boon-of-spell-recall',
      'srd-2024:boon-of-truesight',
      'srd-2024:skilled',
      'srd-2024:grappler',
    ]) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('requires Magic Initiate spellcasting ability choice', async () => {
    const feat = await createBundledFeatCatalog().getFeat(
      'srd-2024:magic-initiate-wizard',
    )
    expect(feat).not.toBeNull()
    expect(
      validateFeatDefinitionChoices(feat!, {}),
    ).toEqual([
      {
        code: 'missing-required-choice',
        choiceId: 'spellcasting-ability',
      },
    ])
    expect(
      validateFeatDefinitionChoices(feat!, {
        'spellcasting-ability': 'charisma',
      }),
    ).toEqual([])
  })

  it('requires Epic Boon +1 ASI choices and applies them to scores', async () => {
    const catalog = createBundledFeatCatalog()
    const boon = await catalog.getFeat('srd-2024:boon-of-truesight')
    expect(boon).not.toBeNull()

    expect(validateFeatDefinitionChoices(boon!, {})).toEqual([
      {
        code: 'missing-required-choice',
        choiceId: 'ability-score-increase',
      },
    ])

    const storageKey = createFeatGrantChoiceStorageKey(
      'epic-boon',
      'ability-score-increase',
    )
    const totals = resolveCharacterAbilityScores({
      baseScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      classes: [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 19,
          choices: {
            'epic-boon': selectEpicBoonFeat(boon!.id),
            [storageKey]: selectAsiPlus1('wisdom'),
          },
        },
      ],
      featById: new Map([[boon!.id, boon!]]),
    })

    expect(totals.wisdom).toBe(11)
  })

  it('restricts Irresistible Offense and Spell Recall ability picks', async () => {
    const catalog = createBundledFeatCatalog()
    const irresistible = await catalog.getFeat(
      'srd-2024:boon-of-irresistible-offense',
    )
    const spellRecall = await catalog.getFeat('srd-2024:boon-of-spell-recall')

    expect(
      validateFeatDefinitionChoices(irresistible!, {
        'ability-score-increase': selectAsiPlus1('charisma'),
      }),
    ).toEqual([
      { code: 'invalid-choice', choiceId: 'ability-score-increase' },
    ])

    expect(
      validateFeatDefinitionChoices(spellRecall!, {
        'ability-score-increase': selectAsiPlus1('strength'),
      }),
    ).toEqual([
      { code: 'invalid-choice', choiceId: 'ability-score-increase' },
    ])

    expect(
      validateFeatDefinitionChoices(spellRecall!, {
        'ability-score-increase': selectAsiPlus1('intelligence'),
      }),
    ).toEqual([])
  })

  it('resolves Truesight sense and Night Spirit resistance from effects', async () => {
    const catalog = createBundledFeatCatalog()
    const truesight = await catalog.getFeat('srd-2024:boon-of-truesight')
    const nightSpirit = await catalog.getFeat(
      'srd-2024:boon-of-the-night-spirit',
    )

    const effects = resolveCharacterFeatEffects(
      [
        {
          featId: truesight!.id,
          choices: {},
          source: { kind: 'character-feat' },
          displayLabel: truesight!.name,
        },
        {
          featId: nightSpirit!.id,
          choices: {},
          source: { kind: 'character-feat' },
          displayLabel: nightSpirit!.name,
        },
      ],
      new Map([
        [truesight!.id, truesight!],
        [nightSpirit!.id, nightSpirit!],
      ]),
    )

    expect(resolveSensesFromFeatEffects(effects)).toEqual([
      { sense: 'truesight', label: 'Truesight', detail: '60 ft.' },
    ])
    expect(resolveResistancesFromFeatEffects(effects)[0]?.detail).toContain(
      'Dim Light or Darkness',
    )
  })

  it('keeps Spell Recall behind generic spellcasting prerequisite', async () => {
    const feat = await createBundledFeatCatalog().getFeat(
      'srd-2024:boon-of-spell-recall',
    )
    expect(
      evaluateFeatEligibility(feat!, {
        characterLevel: 19,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        hasSpellcasting: false,
        hasFightingStyle: false,
        takenFeatIds: [],
      }).eligible,
    ).toBe(false)

    expect(
      evaluateFeatEligibility(feat!, {
        characterLevel: 19,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        hasSpellcasting: true,
        hasFightingStyle: false,
        takenFeatIds: [],
      }).eligible,
    ).toBe(true)
  })

  it('supports content-defined feats without core feat-id branches', () => {
    const customSenseFeat: FeatDefinition = {
      id: 'test-pack:sense-feat',
      editionId: 'srd-2024',
      name: 'Custom Sense',
      summary: 'Grants blindsight',
      description: 'Test',
      source: SYNTHETIC_SOURCE,
      category: 'general',
      prerequisite: { kind: 'none' },
      benefits: [],
      repeatable: false,
      choices: [],
      effects: [{ kind: 'sense', sense: 'blindsight', rangeFeet: 30 }],
    }

    const restrictedAsiFeat: FeatDefinition = {
      id: 'test-pack:restricted-asi',
      editionId: 'srd-2024',
      name: 'Restricted ASI',
      summary: 'Cha +1 max 30',
      description: 'Test',
      source: SYNTHETIC_SOURCE,
      category: 'epic-boon',
      prerequisite: {
        kind: 'requirements',
        summary: 'Level 19+',
        requirements: [{ kind: 'min-character-level', level: 19 }],
      },
      benefits: [],
      repeatable: false,
      choices: [
        createAsiScoreIncreaseChoice({
          modes: ['plus-1'],
          abilities: ['charisma'],
          maximum: 30,
        }),
      ],
    }

    const casterFeat: FeatDefinition = {
      id: 'test-pack:caster-boon',
      editionId: 'srd-2024',
      name: 'Caster Boon',
      summary: 'Requires spellcasting',
      description: 'Test',
      source: SYNTHETIC_SOURCE,
      category: 'epic-boon',
      prerequisite: {
        kind: 'requirements',
        summary: 'Level 19+, Spellcasting',
        requirements: [
          { kind: 'min-character-level', level: 19 },
          { kind: 'has-spellcasting' },
        ],
      },
      benefits: [],
      repeatable: false,
      choices: [
        createAsiScoreIncreaseChoice({
          modes: ['plus-1'],
          abilities: ['intelligence', 'wisdom', 'charisma'],
          maximum: 30,
        }),
      ],
    }

    expect(
      resolveSensesFromFeatEffects(
        resolveCharacterFeatEffects(
          [
            {
              featId: customSenseFeat.id,
              choices: {},
              source: { kind: 'character-feat' },
              displayLabel: customSenseFeat.name,
            },
          ],
          new Map([[customSenseFeat.id, customSenseFeat]]),
        ),
      ),
    ).toEqual([{ sense: 'blindsight', label: 'Blindsight', detail: '30 ft.' }])

    expect(
      validateFeatDefinitionChoices(restrictedAsiFeat, {
        'ability-score-increase': selectAsiPlus1('strength'),
      }),
    ).toEqual([{ code: 'invalid-choice', choiceId: 'ability-score-increase' }])

    expect(
      evaluateFeatEligibility(casterFeat, {
        characterLevel: 19,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        hasSpellcasting: true,
        hasFightingStyle: false,
        takenFeatIds: [],
      }).eligible,
    ).toBe(true)
  })

  it('enforces ASI maximum against scores before the grant', async () => {
    const asi = await createBundledFeatCatalog().getFeat(
      'srd-2024:ability-score-improvement',
    )
    expect(
      validateFeatDefinitionChoices(
        asi!,
        { 'ability-score-increase': 'plus-2:strength' },
        {
          abilityScoresBeforeGrant: {
            strength: 19,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
        },
      ),
    ).toEqual([
      {
        code: 'ability-score-maximum-exceeded',
        choiceId: 'ability-score-increase',
      },
    ])
  })
})
