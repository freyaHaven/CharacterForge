import { describe, expect, it } from 'vitest'
import { rangerSrd2024 } from '../ranger'
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
  RANGER_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { createRangerWeaponMasteryChoices } from '../ranger.weaponMastery'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['spellcasting', 'favored-enemy', 'weapon-mastery'],
  2: ['deft-explorer', 'fighting-style'],
  3: ['ranger-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['extra-attack', 'favored-enemy-uses-3'],
  6: ['roving'],
  7: ['ranger-subclass-feature-7'],
  8: ['ability-score-improvement-8'],
  9: ['expertise-9', 'favored-enemy-uses-4'],
  10: ['tireless'],
  11: ['ranger-subclass-feature-11'],
  12: ['ability-score-improvement-12'],
  13: ['relentless-hunter', 'favored-enemy-uses-5'],
  14: ['natures-veil'],
  15: ['ranger-subclass-feature-15'],
  16: ['ability-score-improvement-16'],
  17: ['precise-hunter', 'favored-enemy-uses-6'],
  18: ['feral-senses'],
  19: ['epic-boon'],
  20: ['foe-slayer'],
}

const CUMULATIVE_FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: FEATURE_IDS_BY_LEVEL[1],
  2: [...FEATURE_IDS_BY_LEVEL[1], ...FEATURE_IDS_BY_LEVEL[2]],
  3: [
    ...FEATURE_IDS_BY_LEVEL[1],
    ...FEATURE_IDS_BY_LEVEL[2],
    ...FEATURE_IDS_BY_LEVEL[3],
  ],
}

function buildExpectedCumulativeIds(level: number): string[] {
  const ids: string[] = []

  for (let currentLevel = 1; currentLevel <= level; currentLevel += 1) {
    ids.push(...FEATURE_IDS_BY_LEVEL[currentLevel])
  }

  return ids
}

for (let level = 4; level <= 20; level += 1) {
  CUMULATIVE_FEATURE_IDS_BY_LEVEL[level] = buildExpectedCumulativeIds(level)
}

function createValidRangerSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['stealth', 'perception', 'survival'],
    ...createRangerWeaponMasteryChoices(level),
    ...createAsiChoicesUpToLevel(level, RANGER_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices['fighting-style'] = 'archery'
    choices.expertise = ['stealth']
  }

  if (level >= 3) {
    choices['ranger-subclass'] = 'hunter'
  }

  if (level >= 9) {
    choices['expertise-9'] = ['perception', 'survival']
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat(
      'srd-2024:boon-of-dimensional-travel',
    )
  }

  return {
    classId: 'srd-2024:ranger',
    level,
    choices,
  }
}

describe('rangerSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(rangerSrd2024, level).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
  })

  it.each(
    Object.entries(CUMULATIVE_FEATURE_IDS_BY_LEVEL).map(
      ([level, featureIds]) => [Number(level), featureIds],
    ),
  )(
    'preserves cumulative feature ordering through level %i',
    (level, featureIds) => {
      expect(
        getClassFeaturesUpToLevel(rangerSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(rangerSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(
      rangerSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = rangerSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(rangerSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(rangerSrd2024, 2).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'fighting-style',
      'expertise',
    ])
    expect(
      getChoicesAvailableAtLevel(rangerSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'fighting-style',
      'expertise',
      'ranger-subclass',
    ])
    expect(
      getChoicesAvailableAtLevel(rangerSrd2024, 9).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'fighting-style',
      'expertise',
      'ranger-subclass',
      'expertise-9',
      'ability-score-improvement-4',
      'ability-score-improvement-8',
    ])
  })

  it.each([1, 2, 3, 4, 9, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidRangerSelection(level),
          'srd-2024',
          rangerSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Hunter when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:ranger',
          level: 3,
          choices: {
            'skill-proficiencies': ['stealth', 'perception', 'survival'],
            'weapon-mastery': createRangerWeaponMasteryChoices(3)[
              'weapon-mastery'
            ],
            'fighting-style': 'archery',
            expertise: ['stealth'],
          },
        },
        'srd-2024',
        rangerSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'ranger-subclass' }],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['stealth', 'perception', 'survival'],
        ...createRangerWeaponMasteryChoices(1),
        'fighting-style': 'archery',
        expertise: ['stealth'],
        'ranger-subclass': 'hunter',
        'expertise-9': ['perception', 'survival'],
        'ability-score-improvement-4': 'asi-strength-dexterity',
      },
      getChoicesAvailableAtLevel(rangerSrd2024, 2),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['stealth', 'perception', 'survival'],
      ...createRangerWeaponMasteryChoices(1),
      'fighting-style': 'archery',
      expertise: ['stealth'],
    })
  })

  it('offers Hunter without a placeholder label', () => {
    const subclassChoice = rangerSrd2024.choices.find(
      (choice) => choice.id === 'ranger-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Hunter'])
  })

  it('surfaces Hunter features through the subclass choice option', () => {
    const subclassChoice = rangerSrd2024.choices.find(
      (choice) => choice.id === 'ranger-subclass',
    )
    const hunterOption =
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.find((option) => option.id === 'hunter')
        : undefined

    expect(hunterOption?.label).toBe('Hunter')
    expect(hunterOption?.features?.map((feature) => feature.level)).toEqual([
      3, 3, 7, 11, 15,
    ])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(rangerSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(rangerSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(false)
  })
})
