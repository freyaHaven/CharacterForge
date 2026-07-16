import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from './fighter'
import { getChoicesAvailableAtLevel, pruneClassChoicesForLevel } from '../../../domain/class/choiceAvailability'
import {
  getClassFeatureProgressionUpToLevel,
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from '../../../domain/class/featureProgression'
import { createAsiChoicesUpToLevel } from '../../../domain/class/abilityScoreImprovement'
import { createWeaponMasteryChoices } from '../../../domain/class/weaponMastery'
import { validateClassSelection } from '../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['fighting-style', 'second-wind', 'weapon-mastery'],
  2: ['action-surge', 'tactical-mind'],
  3: ['fighter-subclass'],
  4: [
    'ability-score-improvement-4',
    'second-wind-uses-3',
    'weapon-mastery-weapons-4',
  ],
  5: ['extra-attack', 'tactical-shift'],
  6: ['ability-score-improvement-6'],
  7: ['fighter-subclass-feature-7'],
  8: ['ability-score-improvement-8'],
  9: ['indomitable', 'tactical-master'],
  10: [
    'fighter-subclass-feature-10',
    'second-wind-uses-4',
    'weapon-mastery-weapons-5',
  ],
  11: ['two-extra-attacks'],
  12: ['ability-score-improvement-12'],
  13: ['indomitable-uses-2', 'studied-attacks'],
  14: ['ability-score-improvement-14'],
  15: ['fighter-subclass-feature-15'],
  16: ['ability-score-improvement-16', 'weapon-mastery-weapons-6'],
  17: ['action-surge-uses-2', 'indomitable-uses-3'],
  18: ['fighter-subclass-feature-18'],
  19: ['epic-boon'],
  20: ['three-extra-attacks'],
}

const CUMULATIVE_FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: FEATURE_IDS_BY_LEVEL[1],
  2: [...FEATURE_IDS_BY_LEVEL[1], ...FEATURE_IDS_BY_LEVEL[2]],
  3: [...FEATURE_IDS_BY_LEVEL[1], ...FEATURE_IDS_BY_LEVEL[2], ...FEATURE_IDS_BY_LEVEL[3]],
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

function createValidFighterSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'fighting-style': 'defense',
    'skill-proficiencies': ['athletics', 'perception'],
    ...createWeaponMasteryChoices(level),
    ...createAsiChoicesUpToLevel(level),
  }

  if (level >= 3) {
    choices['fighter-subclass'] = 'champion'
  }

  return {
    classId: 'srd-2024:fighter',
    level,
    choices,
  }
}

describe('fighterSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(getClassFeaturesForLevel(fighterSrd2024, level).map((feature) => feature.id)).toEqual(
      featureIds,
    )
  })

  it.each(
    Object.entries(CUMULATIVE_FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )(
    'preserves cumulative feature ordering through level %i',
    (level, featureIds) => {
      expect(
        getClassFeaturesUpToLevel(fighterSrd2024, level).map((feature) => feature.id),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(fighterSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(fighterSrd2024.featureProgression.map((entry) => entry.level)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = fighterSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('describes Second Wind with two starting uses', () => {
    const secondWind = getClassFeaturesForLevel(fighterSrd2024, 1).find(
      (feature) => feature.id === 'second-wind',
    )

    expect(secondWind?.description).toMatch(/twice/i)
    expect(secondWind?.description).not.toMatch(
      /cannot use it again until you finish a Short or Long Rest/i,
    )
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['fighting-style', 'skill-proficiencies', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 2).map((choice) => choice.id),
    ).toEqual(['fighting-style', 'skill-proficiencies', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'fighting-style',
      'skill-proficiencies',
      'weapon-mastery',
      'fighter-subclass',
    ])
    expect(
      getChoicesAvailableAtLevel(fighterSrd2024, 4).map((choice) => choice.id),
    ).toEqual([
      'fighting-style',
      'skill-proficiencies',
      'weapon-mastery',
      'weapon-mastery-weapons-4',
      'fighter-subclass',
      'ability-score-improvement-4',
    ])
  })

  it.each([1, 2, 3, 4, 10, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidFighterSelection(level),
          'srd-2024',
          fighterSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Champion when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {
            'fighting-style': 'defense',
            'skill-proficiencies': ['athletics', 'perception'],
            'weapon-mastery': createWeaponMasteryChoices(3)['weapon-mastery'],
          },
        },
        'srd-2024',
        fighterSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'fighter-subclass' }],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'fighting-style': 'archery',
        'skill-proficiencies': ['athletics', 'perception'],
        ...createWeaponMasteryChoices(1),
        'fighter-subclass': 'champion',
      },
      getChoicesAvailableAtLevel(fighterSrd2024, 1),
    )

    expect(pruned).toEqual({
      'fighting-style': 'archery',
      'skill-proficiencies': ['athletics', 'perception'],
      ...createWeaponMasteryChoices(1),
    })
  })

  it('offers Champion without a placeholder label', () => {
    const subclassChoice = fighterSrd2024.choices.find(
      (choice) => choice.id === 'fighter-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Champion'])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 4).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(fighterSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(true)
  })
})
