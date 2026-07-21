import { describe, expect, it } from 'vitest'
import { rogueSrd2024 } from '../rogue'
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
  ROGUE_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { createRogueWeaponMasteryChoices } from '../rogue.weaponMastery'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['expertise', 'sneak-attack', 'thieves-cant', 'weapon-mastery'],
  2: ['cunning-action'],
  3: ['rogue-subclass', 'steady-aim', 'sneak-attack-2d6'],
  4: ['ability-score-improvement-4'],
  5: ['cunning-strike', 'uncanny-dodge', 'sneak-attack-3d6'],
  6: ['expertise-6'],
  7: ['evasion', 'reliable-talent', 'sneak-attack-4d6'],
  8: ['ability-score-improvement-8'],
  9: ['rogue-subclass-feature-9', 'sneak-attack-5d6'],
  10: ['ability-score-improvement-10'],
  11: ['improved-cunning-strike', 'sneak-attack-6d6'],
  12: ['ability-score-improvement-12'],
  13: ['rogue-subclass-feature-13', 'sneak-attack-7d6'],
  14: ['devious-strikes'],
  15: ['slippery-mind', 'sneak-attack-8d6'],
  16: ['ability-score-improvement-16'],
  17: ['rogue-subclass-feature-17', 'sneak-attack-9d6'],
  18: ['elusive'],
  19: ['epic-boon', 'sneak-attack-10d6'],
  20: ['stroke-of-luck'],
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

function createValidRogueSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': [
      'stealth',
      'sleight-of-hand',
      'perception',
      'athletics',
    ],
    expertise: ['stealth', 'sleight-of-hand'],
    ...createRogueWeaponMasteryChoices(level),
    ...createAsiChoicesUpToLevel(level, ROGUE_ASI_FEATURE_LEVELS),
  }

  if (level >= 3) {
    choices['rogue-subclass'] = 'thief'
  }

  if (level >= 6) {
    choices['expertise-6'] = ['perception', 'athletics']
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-the-night-spirit')
  }

  return {
    classId: 'srd-2024:rogue',
    level,
    choices,
  }
}

describe('rogueSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(rogueSrd2024, level).map(
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
        getClassFeaturesUpToLevel(rogueSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual(featureIds)
      expect(
        getClassFeatureProgressionUpToLevel(rogueSrd2024, level).flatMap(
          (entry) => entry.features.map((feature) => feature.id),
        ),
      ).toEqual(featureIds)
    },
  )

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(rogueSrd2024.featureProgression.map((entry) => entry.level)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    )
  })

  it('uses distinct feature IDs across the full progression', () => {
    const featureIds = rogueSrd2024.featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    )

    expect(new Set(featureIds).size).toBe(featureIds.length)
  })

  it('exposes required class-step choices at the expected levels', () => {
    expect(
      getChoicesAvailableAtLevel(rogueSrd2024, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'expertise', 'weapon-mastery'])
    expect(
      getChoicesAvailableAtLevel(rogueSrd2024, 3).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'expertise',
      'weapon-mastery',
      'rogue-subclass',
    ])
    expect(
      getChoicesAvailableAtLevel(rogueSrd2024, 6).map((choice) => choice.id),
    ).toEqual([
      'skill-proficiencies',
      'expertise',
      'weapon-mastery',
      'rogue-subclass',
      'expertise-6',
      'ability-score-improvement-4',
    ])
  })

  it.each([1, 2, 3, 4, 6, 10, 17, 20] as const)(
    'validates supported class-step choices at level %i',
    (level) => {
      expect(
        validateClassSelection(
          createValidRogueSelection(level),
          'srd-2024',
          rogueSrd2024,
        ),
      ).toEqual({ ok: true })
    },
  )

  it('requires Thief when the starting level is 3 or higher', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:rogue',
          level: 3,
          choices: {
            'skill-proficiencies': [
              'stealth',
              'sleight-of-hand',
              'perception',
              'athletics',
            ],
            expertise: ['stealth', 'sleight-of-hand'],
            'weapon-mastery': createRogueWeaponMasteryChoices(3)[
              'weapon-mastery'
            ],
          },
        },
        'srd-2024',
        rogueSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'rogue-subclass' }],
    })
  })

  it('prunes only unavailable choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': [
          'stealth',
          'sleight-of-hand',
          'perception',
          'athletics',
        ],
        expertise: ['stealth', 'sleight-of-hand'],
        ...createRogueWeaponMasteryChoices(1),
        'rogue-subclass': 'thief',
        'expertise-6': ['perception', 'athletics'],
      },
      getChoicesAvailableAtLevel(rogueSrd2024, 1),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': [
        'stealth',
        'sleight-of-hand',
        'perception',
        'athletics',
      ],
      expertise: ['stealth', 'sleight-of-hand'],
      ...createRogueWeaponMasteryChoices(1),
    })
  })

  it('offers Thief without a placeholder label', () => {
    const subclassChoice = rogueSrd2024.choices.find(
      (choice) => choice.id === 'rogue-subclass',
    )

    expect(subclassChoice?.type).toBe('single-select')
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.label)
        : [],
    ).toEqual(['Thief'])
  })

  it('resolves deferred requirements for the selected level', () => {
    expect(
      resolveDeferredCharacterRequirements(rogueSrd2024, 1).map(
        (requirement) => requirement.description,
      ),
    ).toEqual(['Choose starting equipment in Equipment'])

    expect(
      resolveDeferredCharacterRequirements(rogueSrd2024, 19).some(
        (requirement) => requirement.id === 'epic-boon-19',
      ),
    ).toBe(false)
  })
})
