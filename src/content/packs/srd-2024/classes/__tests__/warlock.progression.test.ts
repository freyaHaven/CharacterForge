import { describe, expect, it } from 'vitest'
import { warlockSrd2024 } from '../warlock'
import { wizardSrd2024 } from '../wizard'
import {
  getChoicesAvailableAtLevel,
} from '../../../../../domain/class/choiceAvailability'
import {
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from '../../../../../domain/class/featureProgression'
import {
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { selectCatalogueFeatGrant } from '../../../../../domain/class/catalogueFeatGrant'
import {
  getIneligibleClassChoiceOptionIds,
  isClassChoiceOptionEligible,
} from '../../../../../domain/class/classOptionPrerequisites'
import { pruneClassInstanceChoicesForLevel } from '../../../../../domain/class/pruneClassInstanceChoices'
import { withLevelAdjustedChoiceLimits } from '../../../../../domain/class/weaponMastery'
import { validateClassInstance } from '../../../../../rules/class/classRules'
import { resolveClassEffects } from '../../../../../rules/class/resolveClassEffects'
import { meetsMulticlassPrerequisite } from '../../../../../rules/class/multiclassPrerequisites'
import { createDefaultCharacter } from '../../../../../domain/character/defaults'
import { resolveCharacterSpellcasting } from '../../../../../rules/character/resolveCharacterSpellcasting'
import { createBundledSpellCatalog } from '../../../../../adapters/bundledSpellCatalog'
import { createBundledClassCatalog } from '../../../../../adapters/bundledClassCatalog'
import {
  collectSlotContributors,
  resolvePactMagicSlots,
  resolveSharedSpellSlots,
} from '../../../../../rules/spell/resolveSharedSpellSlots'
import { WARLOCK_INVOCATIONS_BY_LEVEL } from '../../progressions'
import type { CharacterClassSelection } from '../../../../../domain/class/types'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['pact-magic', 'eldritch-invocations'],
  2: ['magical-cunning'],
  3: ['warlock-subclass'],
  4: ['ability-score-improvement-4'],
  5: [],
  6: [],
  7: [],
  8: ['ability-score-improvement-8'],
  9: ['contact-patron'],
  10: [],
  11: ['mystic-arcanum-6'],
  12: ['ability-score-improvement-12'],
  13: ['mystic-arcanum-7'],
  14: [],
  15: ['mystic-arcanum-8'],
  16: ['ability-score-improvement-16'],
  17: ['mystic-arcanum-9'],
  18: [],
  19: ['epic-boon'],
  20: ['eldritch-master'],
}

function invocationsAt(level: number): string[] {
  const count = WARLOCK_INVOCATIONS_BY_LEVEL[level - 1]!
  const pool = [
    'eldritch-mind',
    'armor-of-shadows',
    'mask-of-many-faces',
    'misty-visions',
    'pact-of-the-blade',
    'devils-sight',
    'fiendish-vigor',
    'otherworldly-leap',
    'agonizing-blast',
    'repelling-blast',
  ]
  return pool.slice(0, count)
}

function completeWarlockChoices(
  level: number,
): CharacterClassSelection['choices'] {
  const choices: CharacterClassSelection['choices'] = {
    'skill-proficiencies': ['arcana', 'deception'],
    'eldritch-invocations': invocationsAt(level),
  }

  if (choices['eldritch-invocations']?.includes('pact-of-the-blade')) {
    choices['pact-blade-weapon'] = 'longsword'
  }
  if (choices['eldritch-invocations']?.includes('agonizing-blast')) {
    choices['invocation-agonizing-blast-cantrip'] = 'srd-2024:eldritch-blast'
  }
  if (choices['eldritch-invocations']?.includes('repelling-blast')) {
    choices['invocation-repelling-blast-cantrip'] = 'srd-2024:eldritch-blast'
  }

  if (level >= 3) {
    choices['warlock-subclass'] = 'fiend'
  }
  if (level >= 10) {
    choices['fiendish-resilience'] = 'fire'
  }

  Object.assign(choices, createAsiChoicesUpToLevel(level, [4, 8, 12, 16]))

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-fate')
  }

  return choices
}

describe('warlock progression', () => {
  it('exposes expected features by level', () => {
    for (let level = 1; level <= 20; level += 1) {
      expect(
        getClassFeaturesForLevel(warlockSrd2024, level).map(
          (feature) => feature.id,
        ),
      ).toEqual([...FEATURE_IDS_BY_LEVEL[level]!])
    }
  })

  it('includes Contact Patron and Eldritch Master in cumulative features', () => {
    const at20 = getClassFeaturesUpToLevel(warlockSrd2024, 20).map(
      (feature) => feature.id,
    )
    expect(at20).toContain('contact-patron')
    expect(at20).toContain('eldritch-master')
    expect(at20).toContain('mystic-arcanum-9')
  })

  it('validates a complete Warlock at key levels', () => {
    for (const level of [1, 2, 3, 5, 9, 10, 11, 17, 20] as const) {
      const result = validateClassInstance(
        {
          instanceId: 'w1',
          classId: warlockSrd2024.id,
          level,
          choices: completeWarlockChoices(level),
        },
        'srd-2024',
        warlockSrd2024,
      )
      expect(result.ok, `level ${level}`).toBe(true)
    }
  })

  it('gates Thirsting Blade behind Pact of the Blade and level 5', () => {
    const choice = warlockSrd2024.choices.find(
      (entry) => entry.id === 'eldritch-invocations',
    )
    expect(choice?.type).toBe('multi-select')
    if (choice?.type !== 'multi-select') {
      return
    }

    const thirsting = choice.options.find(
      (option) => option.id === 'thirsting-blade',
    )!
    expect(
      isClassChoiceOptionEligible(thirsting, {
        sourceLevel: 5,
        selectedChoices: { 'eldritch-invocations': ['pact-of-the-blade'] },
      }),
    ).toBe(true)
    expect(
      isClassChoiceOptionEligible(thirsting, {
        sourceLevel: 5,
        selectedChoices: { 'eldritch-invocations': ['eldritch-mind'] },
      }),
    ).toBe(false)
    expect(
      isClassChoiceOptionEligible(thirsting, {
        sourceLevel: 4,
        selectedChoices: { 'eldritch-invocations': ['pact-of-the-blade'] },
      }),
    ).toBe(false)

    const ineligible = getIneligibleClassChoiceOptionIds(choice, {
      sourceLevel: 1,
      selectedChoices: { 'eldritch-invocations': ['eldritch-mind'] },
    })
    expect(ineligible.some((entry) => entry.optionId === 'thirsting-blade')).toBe(
      true,
    )
  })

  it('prunes Thirsting Blade when Pact of the Blade is removed', () => {
    const instance: CharacterClassSelection = {
      instanceId: 'w1',
      classId: warlockSrd2024.id,
      level: 5,
      choices: {
        'skill-proficiencies': ['arcana', 'deception'],
        'eldritch-invocations': [
          'pact-of-the-blade',
          'thirsting-blade',
          'eldritch-mind',
          'armor-of-shadows',
          'mask-of-many-faces',
        ],
        'pact-blade-weapon': 'longsword',
        'warlock-subclass': 'fiend',
      },
    }

    const withoutBlade: CharacterClassSelection = {
      ...instance,
      choices: {
        ...instance.choices,
        'eldritch-invocations': [
          'eldritch-mind',
          'armor-of-shadows',
          'mask-of-many-faces',
          'misty-visions',
          'devils-sight',
        ],
      },
    }

    const pruned = pruneClassInstanceChoicesForLevel(
      withoutBlade,
      warlockSrd2024,
      5,
    )
    const invocations = pruned.choices['eldritch-invocations']
    expect(Array.isArray(invocations) ? invocations : []).not.toContain(
      'thirsting-blade',
    )
    expect(pruned.choices['pact-blade-weapon']).toBeUndefined()
  })

  it('prunes invocation count on level-down', () => {
    const at5: CharacterClassSelection = {
      instanceId: 'w1',
      classId: warlockSrd2024.id,
      level: 5,
      choices: completeWarlockChoices(5),
    }
    const pruned = pruneClassInstanceChoicesForLevel(at5, warlockSrd2024, 1)
    const choice = withLevelAdjustedChoiceLimits(
      warlockSrd2024.choices.find((entry) => entry.id === 'eldritch-invocations')!,
      1,
    )
    const invocations = pruned.choices['eldritch-invocations']
    expect(Array.isArray(invocations) ? invocations.length : 0).toBe(
      choice.type === 'multi-select' ? choice.max : 0,
    )
  })

  it('keeps Pact Magic slots separate from Wizard shared slots', async () => {
    const character = createDefaultCharacter({
      editionId: 'srd-2024',
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 14,
        wisdom: 12,
        charisma: 15,
      },
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 3,
          choices: {},
        },
        {
          instanceId: 'war-1',
          classId: warlockSrd2024.id,
          level: 2,
          choices: completeWarlockChoices(2),
        },
      ],
      startingClassInstanceId: 'wiz-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      { spellCatalog: createBundledSpellCatalog() },
    )

    expect(summary.sharedSlots).not.toBeNull()
    expect(summary.pactSlots).not.toBeNull()
    expect(summary.pactSlots?.sources).toHaveLength(1)
    expect(summary.pactSlots?.sources[0]).toMatchObject({
      instanceId: 'war-1',
      slotCount: 2,
      slotLevel: 1,
    })
  })

  it('resolves prepared ceiling from pact slot level', async () => {
    const character = createDefaultCharacter({
      editionId: 'srd-2024',
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 16,
      },
      classes: [
        {
          instanceId: 'war-1',
          classId: warlockSrd2024.id,
          level: 5,
          choices: completeWarlockChoices(5),
        },
      ],
      startingClassInstanceId: 'war-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      { spellCatalog: createBundledSpellCatalog() },
    )

    const prepared = summary.groups
      .flatMap((group) => group.entitlements)
      .find((entry) => entry.entitlementId === 'prepared')
    expect(prepared?.accessibleLevels).toEqual([1, 2, 3])
  })

  it('grants Contact Other Plane at level 9 and Fiend spells at 3', async () => {
    const character = createDefaultCharacter({
      editionId: 'srd-2024',
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 16,
      },
      classes: [
        {
          instanceId: 'war-1',
          classId: warlockSrd2024.id,
          level: 9,
          choices: completeWarlockChoices(9),
        },
      ],
      startingClassInstanceId: 'war-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      { spellCatalog: createBundledSpellCatalog() },
    )

    const grantedIds = summary.groups
      .flatMap((group) => group.entitlements)
      .flatMap((entry) => entry.grantedSpells.map((spell) => spell.spellId))

    expect(grantedIds).toContain('srd-2024:contact-other-plane')
    expect(grantedIds).toContain('srd-2024:burning-hands')
    expect(grantedIds).toContain('srd-2024:fireball')
    expect(grantedIds).toContain('srd-2024:geas')
  })

  it('applies Fiendish Resilience damage resistance', () => {
    const effects = resolveClassEffects(warlockSrd2024, {
      classId: warlockSrd2024.id,
      level: 10,
      choices: completeWarlockChoices(10),
    })
    expect(effects).toContainEqual({
      kind: 'damage-resistance',
      damageType: 'fire',
    })
  })

  it('enforces CHA 13 multiclass prerequisite', () => {
    expect(
      meetsMulticlassPrerequisite(warlockSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 12,
      }),
    ).toBe(false)
    expect(
      meetsMulticlassPrerequisite(warlockSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 13,
      }),
    ).toBe(true)
  })

  it('shows Pact of the Blade companion when blade is selected', () => {
    const available = getChoicesAvailableAtLevel(warlockSrd2024, 1, {
      'eldritch-invocations': ['pact-of-the-blade'],
    })
    expect(available.some((choice) => choice.id === 'pact-blade-weapon')).toBe(
      true,
    )
  })

  it('exposes Lessons of the First Ones as an Origin feat grant choice', () => {
    const available = getChoicesAvailableAtLevel(warlockSrd2024, 2, {
      'eldritch-invocations': ['lessons-of-the-first-ones'],
    })
    const lessons = available.find(
      (choice) => choice.id === 'feat-grant:lessons-of-the-first-ones',
    )
    expect(lessons?.type === 'single-select' ? lessons.featGrantCategory : undefined).toBe(
      'origin',
    )
    expect(selectCatalogueFeatGrant('srd-2024:alert')).toContain('feat:')
  })

  it('resolves pact slots at breakpoint levels', () => {
    const definitionsById = new Map([[warlockSrd2024.id, warlockSrd2024]])
    for (const [level, slotCount, slotLevel] of [
      [1, 1, 1],
      [2, 2, 1],
      [5, 2, 3],
      [11, 3, 5],
      [17, 4, 5],
    ] as const) {
      const instances = [
        {
          instanceId: 'war-1',
          classId: warlockSrd2024.id,
          level,
          choices: {},
        },
      ]
      const pact = resolvePactMagicSlots(instances, definitionsById)
      expect(pact?.sources[0]).toMatchObject({ slotCount, slotLevel })
      expect(
        collectSlotContributors(instances, definitionsById),
      ).toHaveLength(0)
      expect(
        resolveSharedSpellSlots(
          collectSlotContributors(instances, definitionsById),
        ),
      ).toBeNull()
    }
  })
})
