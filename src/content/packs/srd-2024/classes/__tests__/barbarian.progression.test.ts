import { describe, expect, it } from 'vitest'
import { barbarianSrd2024 } from '../barbarian'
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
  BARBARIAN_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { createBarbarianWeaponMasteryChoices } from '../barbarian.weaponMastery'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['rage', 'unarmored-defense', 'weapon-mastery'],
  2: ['danger-sense', 'reckless-attack'],
  3: ['barbarian-subclass', 'primal-knowledge', 'rage-uses-3'],
  4: ['ability-score-improvement-4', 'weapon-mastery-weapons-3'],
  5: ['extra-attack', 'fast-movement'],
  6: ['barbarian-subclass-feature-6', 'rage-uses-4'],
  7: ['feral-instinct', 'instinctive-pounce'],
  8: ['ability-score-improvement-8'],
  9: ['brutal-strike', 'rage-damage-3'],
  10: ['barbarian-subclass-feature-10', 'weapon-mastery-weapons-4'],
  11: ['relentless-rage'],
  12: ['ability-score-improvement-12', 'rage-uses-5'],
  13: ['improved-brutal-strike-13'],
  14: ['barbarian-subclass-feature-14'],
  15: ['persistent-rage'],
  16: ['ability-score-improvement-16', 'rage-damage-4'],
  17: ['improved-brutal-strike-17', 'rage-uses-6'],
  18: ['indomitable-might'],
  19: ['epic-boon'],
  20: ['primal-champion'],
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

function createValidBarbarianSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['athletics', 'perception'],
    ...createBarbarianWeaponMasteryChoices(level),
    ...createAsiChoicesUpToLevel(level, BARBARIAN_ASI_FEATURE_LEVELS),
  }

  if (level >= 3) {
    choices['barbarian-subclass'] = 'path-of-the-berserker'
    choices['primal-knowledge'] = ['intimidation']
  }

  return {
    classId: 'srd-2024:barbarian',
    level,
    choices,
  }
}

describe('barbarianSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(barbarianSrd2024, level).map(
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
        getClassFeaturesUpToLevel(barbarianSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(barbarianSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(
      barbarianSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = barbarianSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(barbarianSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(barbarianSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'barbarian-subclass',
      'primal-knowledge',
    ])
    expect(
      getChoicesAvailableAtLevel(barbarianSrd2024, 4).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'weapon-mastery',
      'weapon-mastery-weapons-3',
      'barbarian-subclass',
      'primal-knowledge',
      'ability-score-improvement-4',
    ])
  })

  it.each([1, 2, 3, 4, 10, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidBarbarianSelection(level),
          'srd-2024',
          barbarianSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Path of the Berserker when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:barbarian',
          level: 3,
          choices: {
            'skill-proficiencies': ['athletics', 'perception'],
            'weapon-mastery': createBarbarianWeaponMasteryChoices(3)[
              'weapon-mastery'
            ],
            'primal-knowledge': ['intimidation'],
          },
        },
        'srd-2024',
        barbarianSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [
        { code: 'missing-required-choice', choiceId: 'barbarian-subclass' },
      ],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['athletics', 'perception'],
        ...createBarbarianWeaponMasteryChoices(1),
        'barbarian-subclass': 'path-of-the-berserker',
        'primal-knowledge': ['intimidation'],
      },
      getChoicesAvailableAtLevel(barbarianSrd2024, 1),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['athletics', 'perception'],
      ...createBarbarianWeaponMasteryChoices(1),
    })
  })

  it('offers Path of the Berserker without a placeholder label', () => {
    const subclassChoice = barbarianSrd2024.choices.find(
      (choice) => choice.id === 'barbarian-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Path of the Berserker'])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(barbarianSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(barbarianSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(true)
  })
})
