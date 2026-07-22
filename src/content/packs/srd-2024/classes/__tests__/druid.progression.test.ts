import { describe, expect, it } from 'vitest'
import { druidSrd2024 } from '../druid'
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
  DRUID_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import {
  getEligibleBeastForms,
  getWildShapeKnownFormsCount,
  withWildShapeFormsChoiceLimits,
} from '../../../../../domain/class/beastForms'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'
import { resolveClassEffects } from '../../../../../rules/class/resolveClassEffects'
import { createDefaultCharacter } from '../../../../../domain/character/defaults'
import { resolveCharacterSpellcasting } from '../../../../../rules/character/resolveCharacterSpellcasting'
import { createBundledSpellCatalog } from '../../../../../adapters/bundledSpellCatalog'
import { createBundledClassCatalog } from '../../../../../adapters/bundledClassCatalog'
import { wizardSrd2024 } from '../wizard'
import {
  collectSlotContributors,
  resolveSharedSpellSlots,
} from '../../../../../rules/spell/resolveSharedSpellSlots'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../../../domain/spell/progressions'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['spellcasting', 'druidic', 'primal-order'],
  2: ['wild-shape', 'wild-companion'],
  3: ['druid-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['wild-resurgence'],
  6: ['druid-subclass-feature-6'],
  7: ['elemental-fury'],
  8: ['ability-score-improvement-8'],
  9: [],
  10: ['druid-subclass-feature-10'],
  11: [],
  12: ['ability-score-improvement-12'],
  13: [],
  14: ['druid-subclass-feature-14'],
  15: ['improved-elemental-fury'],
  16: ['ability-score-improvement-16'],
  17: [],
  18: ['beast-spells'],
  19: ['epic-boon'],
  20: ['archdruid'],
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

function pickWildShapeForms(level: number): string[] {
  const count = getWildShapeKnownFormsCount(level)
  return getEligibleBeastForms(level)
    .slice(0, count)
    .map((form) => form.id)
}

function createValidDruidSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['nature', 'perception'],
    'primal-order': 'warden',
    ...createAsiChoicesUpToLevel(level, DRUID_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices['wild-shape-forms'] = pickWildShapeForms(level)
  }

  if (level >= 3) {
    choices['druid-subclass'] = 'circle-of-the-land'
    choices['circle-land'] = 'temperate'
  }

  if (level >= 7) {
    choices['elemental-fury'] = 'potent-spellcasting'
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat(
      'srd-2024:boon-of-dimensional-travel',
    )
  }

  return {
    classId: 'srd-2024:druid',
    level,
    choices,
  }
}

function collectGrantedSpellIds(
  result: Awaited<ReturnType<typeof resolveCharacterSpellcasting>>,
): Set<string> {
  const ids = new Set<string>()
  for (const group of result.groups) {
    for (const entitlement of group.entitlements) {
      for (const grant of entitlement.grantedSpells) {
        ids.add(grant.spellId)
      }
    }
  }
  return ids
}

describe('druidSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(druidSrd2024, level as number).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
  })

  it.each(
    Object.entries(CUMULATIVE_FEATURE_IDS_BY_LEVEL).map(
      ([level, featureIds]) => [Number(level), featureIds],
    ),
  )('exposes cumulative feature IDs up to level %i', (level, featureIds) => {
    expect(
      getClassFeaturesUpToLevel(druidSrd2024, level as number).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
    expect(
      getClassFeatureProgressionUpToLevel(druidSrd2024, level as number).flatMap(
        (entry) => entry.features.map((feature) => feature.id),
      ),
    ).toEqual(featureIds)
  })

  it('validates a complete selection at each level', () => {
    for (let level = 1; level <= 20; level += 1) {
      const selection = createValidDruidSelection(level)
      const result = validateClassSelection(
        selection,
        'srd-2024',
        druidSrd2024,
      )
      expect(result.ok, `level ${level}: ${JSON.stringify(result)}`).toBe(true)
    }
  })

  it('requires primal order, land, and wild shape forms when incomplete', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:druid',
          level: 3,
          choices: {
            'skill-proficiencies': ['nature', 'perception'],
          },
        },
        'srd-2024',
        druidSrd2024,
      ).ok,
    ).toBe(false)
  })

  it('adjusts Wild Shape known forms count by level', () => {
    const choice = druidSrd2024.choices.find(
      (entry) => entry.id === 'wild-shape-forms',
    )
    expect(choice).toBeDefined()
    if (choice === undefined) {
      return
    }

    expect(withWildShapeFormsChoiceLimits(choice, 2)).toMatchObject({
      min: 4,
      max: 4,
    })
    expect(withWildShapeFormsChoiceLimits(choice, 4)).toMatchObject({
      min: 6,
      max: 6,
    })
    expect(withWildShapeFormsChoiceLimits(choice, 8)).toMatchObject({
      min: 8,
      max: 8,
    })
  })

  it('resolves Warden medium armor and martial weapons without class-name checks', () => {
    const effects = resolveClassEffects(
      druidSrd2024,
      createValidDruidSelection(1),
    )

    expect(effects).toContainEqual({
      kind: 'armor-proficiency',
      category: 'medium',
    })
    expect(effects).toContainEqual({
      kind: 'weapon-proficiency',
      category: 'martial',
    })
    expect(effects).toContainEqual({
      kind: 'language',
      languageId: 'druidic',
      label: 'Druidic',
    })
    expect(effects).toContainEqual({
      kind: 'tool-proficiency',
      toolId: 'herbalism-kit',
      label: 'Herbalism Kit',
    })
  })

  it('grants Speak with Animals via feature entitlements', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'druid-1',
          classId: 'srd-2024:druid',
          level: 1,
          choices: createValidDruidSelection(1).choices,
        },
      ],
    })

    const resolved = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      { spellCatalog: createBundledSpellCatalog() },
    )

    const granted = collectGrantedSpellIds(resolved)
    expect(granted.has('srd-2024:speak-with-animals')).toBe(true)
  })

  it('switches Circle of the Land spells when land choice changes', async () => {
    const aridSelection = createValidDruidSelection(5)
    aridSelection.choices['circle-land'] = 'arid'

    const temperateSelection = createValidDruidSelection(5)
    temperateSelection.choices['circle-land'] = 'temperate'

    async function grantsFor(
      selection: ReturnType<typeof createValidDruidSelection>,
    ) {
      const character = createDefaultCharacter({
        classes: [
          {
            instanceId: 'druid-1',
            classId: 'srd-2024:druid',
            level: selection.level,
            choices: selection.choices,
          },
        ],
      })
      const resolved = await resolveCharacterSpellcasting(
        createBundledClassCatalog(),
        character,
        { spellCatalog: createBundledSpellCatalog() },
      )
      return collectGrantedSpellIds(resolved)
    }

    const arid = await grantsFor(aridSelection)
    const temperate = await grantsFor(temperateSelection)

    expect(arid.has('srd-2024:fire-bolt')).toBe(true)
    expect(arid.has('srd-2024:fireball')).toBe(true)
    expect(arid.has('srd-2024:misty-step')).toBe(false)

    expect(temperate.has('srd-2024:misty-step')).toBe(true)
    expect(temperate.has('srd-2024:lightning-bolt')).toBe(true)
    expect(temperate.has('srd-2024:fire-bolt')).toBe(false)
  })

  it('multiclasses Druid + Wizard as full casters for shared slots', () => {
    const contributors = collectSlotContributors(
      [
        {
          instanceId: 'druid-1',
          classId: 'srd-2024:druid',
          level: 3,
          choices: {},
        },
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 2,
          choices: {},
        },
      ],
      new Map([
        [druidSrd2024.id, druidSrd2024],
        [wizardSrd2024.id, wizardSrd2024],
      ]),
    )
    const slots = resolveSharedSpellSlots(contributors)
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('exposes circle-land only when Circle of the Land is selected', () => {
    const withSubclass = getChoicesAvailableAtLevel(druidSrd2024, 3, {
      'druid-subclass': 'circle-of-the-land',
    }).map((choice) => choice.id)

    const withoutSubclass = getChoicesAvailableAtLevel(
      druidSrd2024,
      3,
      {},
    ).map((choice) => choice.id)

    expect(withSubclass).toContain('circle-land')
    expect(withoutSubclass).not.toContain('circle-land')
  })

  it('prunes higher-level choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      createValidDruidSelection(8).choices,
      getChoicesAvailableAtLevel(druidSrd2024, 2),
    )
    expect(pruned['elemental-fury']).toBeUndefined()
    expect(pruned['druid-subclass']).toBeUndefined()
    expect(pruned['circle-land']).toBeUndefined()
    expect(pruned['wild-shape-forms']).toBeDefined()
  })

  it('defers starting equipment', () => {
    const deferred = resolveDeferredCharacterRequirements(druidSrd2024, 1)
    expect(deferred.map((entry) => entry.id)).toEqual(['starting-equipment'])
  })
})
