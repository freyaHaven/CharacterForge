import { describe, expect, it } from 'vitest'
import { wizardSrd2024 } from '../wizard'
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
import { WIZARD_ASI_FEATURE_LEVELS } from '../../progressions'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['spellcasting', 'ritual-adept', 'arcane-recovery'],
  2: ['scholar'],
  3: ['wizard-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['memorize-spell'],
  6: ['wizard-subclass-feature-6'],
  7: [],
  8: ['ability-score-improvement-8'],
  9: [],
  10: ['wizard-subclass-feature-10'],
  11: [],
  12: ['ability-score-improvement-12'],
  13: [],
  14: ['wizard-subclass-feature-14'],
  15: [],
  16: ['ability-score-improvement-16'],
  17: [],
  18: ['spell-mastery'],
  19: ['epic-boon'],
  20: ['signature-spells'],
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

function createValidWizardSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['arcana', 'history'],
    ...createAsiChoicesUpToLevel(level, WIZARD_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices.scholar = ['arcana']
  }

  if (level >= 3) {
    choices['wizard-subclass'] = 'evoker'
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-spell-recall')
  }

  return {
    classId: 'srd-2024:wizard',
    level,
    choices,
  }
}

describe('wizardSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(wizardSrd2024, level as number).map(
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
        getClassFeaturesUpToLevel(wizardSrd2024, level as number).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(
          wizardSrd2024,
          level as number,
        ).flatMap((entry) => entry.features.map((feature) => feature.id)),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(
      wizardSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = wizardSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it.each([1, 2, 3, 4, 18, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidWizardSelection(level),
          'srd-2024',
          wizardSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Scholar when the starting level is 2 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:wizard',
          level: 2,
          choices: {
            'skill-proficiencies': ['arcana', 'history'],
          },
        },
        'srd-2024',
        wizardSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'scholar' }],
    })
  })

  it('requires Evoker when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:wizard',
          level: 3,
          choices: {
            'skill-proficiencies': ['arcana', 'history'],
            scholar: ['arcana'],
          },
        },
        'srd-2024',
        wizardSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [
        { code: 'missing-required-choice', choiceId: 'wizard-subclass' },
      ],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['arcana', 'history'],
        scholar: ['arcana'],
        'wizard-subclass': 'evoker',
        'ability-score-improvement-4': 'asi-strength-dexterity',
      },
      getChoicesAvailableAtLevel(wizardSrd2024, 2),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['arcana', 'history'],
      scholar: ['arcana'],
    })
  })

  it('surfaces starting equipment as a deferred requirement', () => {
    expect(
      resolveDeferredCharacterRequirements(wizardSrd2024, 1).map(
        (entry) => entry.id,
      ),
    ).toEqual(['starting-equipment'])
  })

  it('lists Scholar among choices available at level 2', () => {
    expect(
      getChoicesAvailableAtLevel(wizardSrd2024, 2).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'scholar'])
  })
})
