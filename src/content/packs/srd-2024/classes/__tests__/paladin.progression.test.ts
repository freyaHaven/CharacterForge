import { describe, expect, it } from 'vitest'
import { paladinSrd2024 } from '../paladin'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from '../../../../../domain/class/choiceAvailability'
import {
  getClassFeatureProgressionUpToLevel,
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from '../../../../../domain/class/featureProgression'
import {
  PALADIN_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { createPaladinWeaponMasteryChoices } from '../paladin.weaponMastery'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['lay-on-hands', 'spellcasting', 'weapon-mastery'],
  2: ['fighting-style', 'paladins-smite'],
  3: ['channel-divinity', 'paladin-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['extra-attack', 'faithful-steed'],
  6: ['aura-of-protection'],
  7: ['paladin-subclass-feature-7'],
  8: ['ability-score-improvement-8'],
  9: ['abjure-foes'],
  10: ['aura-of-courage'],
  11: ['radiant-strikes', 'channel-divinity-uses-3'],
  12: ['ability-score-improvement-12'],
  14: ['restoring-touch'],
  15: ['paladin-subclass-feature-15'],
  16: ['ability-score-improvement-16'],
  18: ['aura-expansion'],
  19: ['epic-boon'],
  20: ['paladin-subclass-feature-20'],
}

const EXPECTED_PROGRESSION_LEVELS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20,
]

const CUMULATIVE_FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {}

function buildExpectedCumulativeIds(level: number): string[] {
  const ids: string[] = []

  for (const featureLevel of EXPECTED_PROGRESSION_LEVELS) {
    if (featureLevel > level) {
      break
    }

    ids.push(...(FEATURE_IDS_BY_LEVEL[featureLevel] ?? []))
  }

  return ids
}

for (const level of EXPECTED_PROGRESSION_LEVELS) {
  CUMULATIVE_FEATURE_IDS_BY_LEVEL[level] = buildExpectedCumulativeIds(level)
}

function createValidPaladinSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['athletics', 'persuasion'],
    ...createPaladinWeaponMasteryChoices(level),
    ...createAsiChoicesUpToLevel(level, PALADIN_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices['fighting-style'] = 'defense'
  }

  if (level >= 3) {
    choices['paladin-subclass'] = 'oath-of-devotion'
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-truesight')
  }

  return {
    classId: 'srd-2024:paladin',
    level,
    choices,
  }
}

describe('paladinSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(paladinSrd2024, level).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
  })

  it('has no class features at levels 13 and 17', () => {
    expect(getClassFeaturesForLevel(paladinSrd2024, 13)).toEqual([])
    expect(getClassFeaturesForLevel(paladinSrd2024, 17)).toEqual([])
  })

  it.each(
    Object.entries(CUMULATIVE_FEATURE_IDS_BY_LEVEL).map(
      ([level, featureIds]) => [Number(level), featureIds],
    ),
  )(
    'preserves cumulative feature ordering through level %i',
    (level, featureIds) => {
      expect(
        getClassFeaturesUpToLevel(paladinSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(paladinSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes feature-bearing levels from 1 through 20', () => {
    expect(
      paladinSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual(EXPECTED_PROGRESSION_LEVELS)
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = paladinSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(paladinSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(paladinSrd2024, 2).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'weapon-mastery', 'fighting-style'])
    expect(
      getChoicesAvailableAtLevel(paladinSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'fighting-style',
      'paladin-subclass',
    ])
  })

  it.each([1, 2, 3, 4, 10, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidPaladinSelection(level),
          'srd-2024',
          paladinSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Oath of Devotion when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:paladin',
          level: 3,
          choices: {
            'skill-proficiencies': ['athletics', 'persuasion'],
            'weapon-mastery': createPaladinWeaponMasteryChoices(3)[
              'weapon-mastery'
            ],
            'fighting-style': 'defense',
          },
        },
        'srd-2024',
        paladinSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [
        { code: 'missing-required-choice', choiceId: 'paladin-subclass' },
      ],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['athletics', 'persuasion'],
        ...createPaladinWeaponMasteryChoices(1),
        'fighting-style': 'defense',
        'paladin-subclass': 'oath-of-devotion',
      },
      getChoicesAvailableAtLevel(paladinSrd2024, 1),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['athletics', 'persuasion'],
      ...createPaladinWeaponMasteryChoices(1),
    })
  })

  it('offers Oath of Devotion without a placeholder label', () => {
    const subclassChoice = paladinSrd2024.choices.find(
      (choice) => choice.id === 'paladin-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Oath of Devotion'])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(paladinSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(paladinSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(false)
  })
})
