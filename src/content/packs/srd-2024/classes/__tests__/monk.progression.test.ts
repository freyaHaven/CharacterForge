import { describe, expect, it } from 'vitest'
import { monkSrd2024 } from '../monk'
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
  MONK_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['martial-arts', 'unarmored-defense', 'tool-proficiency'],
  2: ['monks-focus', 'unarmored-movement', 'uncanny-metabolism'],
  3: ['deflect-attacks', 'monk-subclass'],
  4: ['ability-score-improvement-4', 'slow-fall'],
  5: ['extra-attack', 'stunning-strike', 'martial-arts-die-d8'],
  6: [
    'empowered-strikes',
    'monk-subclass-feature-6',
    'unarmored-movement-15',
  ],
  7: ['evasion'],
  8: ['ability-score-improvement-8'],
  9: ['acrobatic-movement'],
  10: [
    'heightened-focus',
    'self-restoration',
    'unarmored-movement-20',
  ],
  11: ['monk-subclass-feature-11', 'martial-arts-die-d10'],
  12: ['ability-score-improvement-12'],
  13: ['deflect-energy'],
  14: ['disciplined-survivor', 'unarmored-movement-25'],
  15: ['perfect-focus'],
  16: ['ability-score-improvement-16'],
  17: ['monk-subclass-feature-17', 'martial-arts-die-d12'],
  18: ['superior-defense', 'unarmored-movement-30'],
  19: ['epic-boon'],
  20: ['body-and-mind'],
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

function createValidMonkSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['acrobatics', 'stealth'],
    'tool-proficiency': 'flute',
    ...createAsiChoicesUpToLevel(level, MONK_ASI_FEATURE_LEVELS),
  }

  if (level >= 3) {
    choices['monk-subclass'] = 'warrior-of-the-open-hand'
  }

  return {
    classId: 'srd-2024:monk',
    level,
    choices,
  }
}

describe('monkSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(monkSrd2024, level).map(
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
        getClassFeaturesUpToLevel(monkSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(monkSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(monkSrd2024.featureProgression.map((entry) => entry.level)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = monkSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(monkSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'tool-proficiency'])
    expect(
      getChoicesAvailableAtLevel(monkSrd2024, 3).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'tool-proficiency', 'monk-subclass'])
    expect(
      getChoicesAvailableAtLevel(monkSrd2024, 4).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'tool-proficiency',
      'monk-subclass',
      'ability-score-improvement-4',
    ])
  })

  it.each([1, 2, 3, 4, 10, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidMonkSelection(level),
          'srd-2024',
          monkSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Open Hand when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:monk',
          level: 3,
          choices: {
            'skill-proficiencies': ['acrobatics', 'stealth'],
            'tool-proficiency': 'flute',
          },
        },
        'srd-2024',
        monkSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'monk-subclass' }],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['acrobatics', 'stealth'],
        'tool-proficiency': 'flute',
        'monk-subclass': 'warrior-of-the-open-hand',
      },
      getChoicesAvailableAtLevel(monkSrd2024, 1),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['acrobatics', 'stealth'],
      'tool-proficiency': 'flute',
    })
  })

  it('offers Warrior of the Open Hand without a placeholder label', () => {
    const subclassChoice = monkSrd2024.choices.find(
      (choice) => choice.id === 'monk-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Warrior of the Open Hand'])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(monkSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(monkSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(true)
  })
})
