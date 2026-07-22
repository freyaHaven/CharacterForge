import { describe, expect, it } from 'vitest'
import { clericSrd2024 } from '../cleric'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from '../../../../../domain/class/choiceAvailability'
import {
  getClassFeatureProgressionUpToLevel,
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from '../../../../../domain/class/featureProgression'
import { createAsiChoicesUpToLevel } from '../../../../../domain/class/abilityScoreImprovement'
import { CLERIC_ASI_FEATURE_LEVELS } from '../../progressions'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['spellcasting', 'divine-order'],
  2: ['channel-divinity'],
  3: ['cleric-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['sear-undead'],
  6: ['cleric-subclass-feature-6', 'channel-divinity-uses-3'],
  7: ['blessed-strikes'],
  8: ['ability-score-improvement-8'],
  9: [],
  10: ['divine-intervention'],
  11: [],
  12: ['ability-score-improvement-12'],
  13: [],
  14: ['improved-blessed-strikes'],
  15: [],
  16: ['ability-score-improvement-16'],
  17: ['cleric-subclass-feature-17'],
  18: ['channel-divinity-uses-4'],
  19: ['epic-boon'],
  20: ['greater-divine-intervention'],
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

function createValidClericSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['insight', 'religion'],
    'divine-order': 'protector',
    ...createAsiChoicesUpToLevel(level, CLERIC_ASI_FEATURE_LEVELS),
  }

  if (level >= 3) {
    choices['cleric-subclass'] = 'life-domain'
  }

  if (level >= 7) {
    choices['blessed-strikes'] = 'potent-spellcasting'
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-fate')
  }

  return {
    classId: 'srd-2024:cleric',
    level,
    choices,
  }
}

describe('clericSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(clericSrd2024, level).map(
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
        getClassFeaturesUpToLevel(clericSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(clericSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(
      clericSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = clericSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(clericSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'divine-order'])
    expect(
      getChoicesAvailableAtLevel(clericSrd2024, 3).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'divine-order', 'cleric-subclass'])
    expect(
      getChoicesAvailableAtLevel(clericSrd2024, 7).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'divine-order',
      'cleric-subclass',
      'blessed-strikes',
      'ability-score-improvement-4',
    ])
  })

  it.each([1, 3, 4, 7, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidClericSelection(level),
          'srd-2024',
          clericSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Life Domain when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:cleric',
          level: 3,
          choices: {
            'skill-proficiencies': ['insight', 'religion'],
            'divine-order': 'protector',
          },
        },
        'srd-2024',
        clericSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'cleric-subclass' }],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['insight', 'religion'],
        'divine-order': 'thaumaturge',
        'cleric-subclass': 'life-domain',
        'blessed-strikes': 'divine-strike',
        'ability-score-improvement-4': 'asi-strength-dexterity',
      },
      getChoicesAvailableAtLevel(clericSrd2024, 3),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['insight', 'religion'],
      'divine-order': 'thaumaturge',
      'cleric-subclass': 'life-domain',
    })
  })

  it('offers Life Domain without a placeholder label', () => {
    const subclassChoice = clericSrd2024.choices.find(
      (choice) => choice.id === 'cleric-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Life Domain'])
  })

  it('surfaces Life Domain features through the subclass choice option', () => {
    const subclassChoice = clericSrd2024.choices.find(
      (choice) => choice.id === 'cleric-subclass',
    )
    const lifeOption =
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.find((option) => option.id === 'life-domain')
        : undefined

    expect(lifeOption?.label).toBe('Life Domain')
    expect(lifeOption?.features?.map((feature) => feature.level)).toEqual([
      3, 3, 3, 6, 17,
    ])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(clericSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(clericSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(false)
  })
})
