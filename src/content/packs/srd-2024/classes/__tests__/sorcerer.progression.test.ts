import { describe, expect, it } from 'vitest'
import { sorcererSrd2024 } from '../sorcerer'
import { wizardSrd2024 } from '../wizard'
import { bardSrd2024 } from '../bard'
import { fighterSrd2024 } from '../fighter'
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
import { SORCERER_ASI_FEATURE_LEVELS } from '../../progressions'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { getExcludedSharedPoolOptionIds } from '../../../../../domain/class/sharedMultiSelectExclusions'
import { validateClassSelection } from '../../../../../rules/class/classRules'
import { resolveDeferredCharacterRequirements } from '../../../../../rules/class/deferredRequirements'
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
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../../../domain/spell/progressions'
import { createTestPactCasterClass } from '../../../../../testing/createTestSpellbookAndPactClasses'
import { GOLD_PIECES_ITEM_ID } from '../../../../../domain/equipment/types'
import { resolveHitPointMaximum } from '../../../../../rules/hit-points/resolveHitPointMaximum'
import { calculateCharacterArmorClass } from '../../../../../rules/armor-class/calculateCharacterArmorClass'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../../domain/equipment/types'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../equipment'
import type { ResolvedEquipment } from '../../../../../rules/character/resolveCharacterEquipment'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['spellcasting', 'innate-sorcery'],
  2: ['font-of-magic', 'metamagic'],
  3: ['sorcerer-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['sorcerous-restoration'],
  6: ['sorcerer-subclass-feature-6'],
  7: ['sorcery-incarnate'],
  8: ['ability-score-improvement-8'],
  9: [],
  10: ['metamagic-10'],
  11: [],
  12: ['ability-score-improvement-12'],
  13: [],
  14: ['sorcerer-subclass-feature-14'],
  15: [],
  16: ['ability-score-improvement-16'],
  17: ['metamagic-17'],
  18: ['sorcerer-subclass-feature-18'],
  19: ['epic-boon'],
  20: ['arcane-apotheosis'],
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

const METAMAGIC_PICKS = [
  'careful-spell',
  'distant-spell',
  'empowered-spell',
  'extended-spell',
  'heightened-spell',
  'quickened-spell',
] as const

function createValidSorcererSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['arcana', 'persuasion'],
    ...createAsiChoicesUpToLevel(level, SORCERER_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices.metamagic = [METAMAGIC_PICKS[0], METAMAGIC_PICKS[1]]
  }

  if (level >= 3) {
    choices['sorcerer-subclass'] = 'draconic-sorcery'
  }

  if (level >= 6) {
    choices['elemental-affinity'] = 'fire'
  }

  if (level >= 10) {
    choices['metamagic-10'] = [METAMAGIC_PICKS[2], METAMAGIC_PICKS[3]]
  }

  if (level >= 17) {
    choices['metamagic-17'] = [METAMAGIC_PICKS[4], METAMAGIC_PICKS[5]]
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat(
      'srd-2024:boon-of-dimensional-travel',
    )
  }

  return {
    classId: 'srd-2024:sorcerer',
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

function emptyResolvedEquipment(): ResolvedEquipment {
  return {
    sources: [],
    entries: [],
    inventory: [],
    mergedInventory: [],
    currency: { goldPieces: 0 },
    weightCarriedLb: 0,
  }
}

describe('sorcererSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(sorcererSrd2024, level as number).map(
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
      getClassFeaturesUpToLevel(sorcererSrd2024, level as number).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
    expect(
      getClassFeatureProgressionUpToLevel(
        sorcererSrd2024,
        level as number,
      ).flatMap((entry) => entry.features.map((feature) => feature.id)),
    ).toEqual(featureIds)
  })

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(
      sorcererSrd2024.featureProgression.map((entry) => entry.level),
    ).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses ASI feature levels 4, 8, 12, and 16', () => {
    expect(SORCERER_ASI_FEATURE_LEVELS).toEqual([4, 8, 12, 16])
    for (const asiLevel of SORCERER_ASI_FEATURE_LEVELS) {
      expect(
        getClassFeaturesForLevel(sorcererSrd2024, asiLevel).some(
          (feature) => feature.id === `ability-score-improvement-${asiLevel}`,
        ),
      ).toBe(true)
    }
  })

  it('validates a complete selection at each level', () => {
    for (let level = 1; level <= 20; level += 1) {
      const selection = createValidSorcererSelection(level)
      const result = validateClassSelection(
        selection,
        'srd-2024',
        sorcererSrd2024,
      )
      expect(result.ok, `level ${level}: ${JSON.stringify(result)}`).toBe(true)
    }
  })

  it('blocks finish when required Metamagic is incomplete', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:sorcerer',
          level: 2,
          choices: {
            'skill-proficiencies': ['arcana', 'persuasion'],
            metamagic: ['careful-spell'],
          },
        },
        'srd-2024',
        sorcererSrd2024,
      ).ok,
    ).toBe(false)
  })

  it('requires subclass and Elemental Affinity when incomplete', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:sorcerer',
          level: 6,
          choices: {
            'skill-proficiencies': ['arcana', 'persuasion'],
            metamagic: ['careful-spell', 'distant-spell'],
            ...createAsiChoicesUpToLevel(6, SORCERER_ASI_FEATURE_LEVELS),
          },
        },
        'srd-2024',
        sorcererSrd2024,
      ).ok,
    ).toBe(false)
  })

  it('resolves Draconic Resilience and Elemental Affinity effects', () => {
    const at3 = resolveClassEffects(
      sorcererSrd2024,
      createValidSorcererSelection(3),
    )
    expect(at3).toContainEqual({
      kind: 'hit-point-maximum-per-class-level',
      amount: 1,
    })
    expect(at3).toContainEqual({
      kind: 'unarmored-defense',
      abilities: ['dexterity', 'charisma'],
    })
    expect(at3.some((effect) => effect.kind === 'damage-resistance')).toBe(
      false,
    )

    const at6 = resolveClassEffects(
      sorcererSrd2024,
      createValidSorcererSelection(6),
    )
    expect(at6).toContainEqual({
      kind: 'damage-resistance',
      damageType: 'fire',
    })
  })

  it('adds +1 HP per Sorcerer level from Draconic Resilience', () => {
    const definitionsById = new Map([[sorcererSrd2024.id, sorcererSrd2024]])
    const without = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'sorc-1',
          classId: sorcererSrd2024.id,
          level: 3,
          choices: {
            'skill-proficiencies': ['arcana', 'persuasion'],
            metamagic: ['careful-spell', 'distant-spell'],
          },
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'fixed' },
            { classLevel: 3, method: 'fixed' },
          ],
        },
      ],
      startingClassInstanceId: 'sorc-1',
      classDefinitionsById: definitionsById,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    const withDraconic = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'sorc-1',
          classId: sorcererSrd2024.id,
          level: 3,
          choices: createValidSorcererSelection(3).choices,
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'fixed' },
            { classLevel: 3, method: 'fixed' },
          ],
        },
      ],
      startingClassInstanceId: 'sorc-1',
      classDefinitionsById: definitionsById,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    expect(withDraconic.maximum - without.maximum).toBe(3)
  })

  it('uses 10 + DEX + CHA for Draconic unarmored AC', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 16,
      },
      resolvedEquipment: emptyResolvedEquipment(),
      loadout: EMPTY_EQUIPMENT_LOADOUT,
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
      unarmoredDefenseOptions: [
        { abilities: ['dexterity', 'charisma'] },
      ],
    })

    expect(result.total).toBe(15)
  })

  it('grants Draconic Spells by subclass level', async () => {
    const catalog = createBundledClassCatalog()
    const spellCatalog = createBundledSpellCatalog()

    const at3 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'sorc-1',
            classId: 'srd-2024:sorcerer',
            level: 3,
            choices: createValidSorcererSelection(3).choices,
          },
        ],
      }),
      { spellCatalog },
    )
    const grantedAt3 = collectGrantedSpellIds(at3)
    expect(grantedAt3.has('srd-2024:chromatic-orb')).toBe(true)
    expect(grantedAt3.has('srd-2024:command')).toBe(true)
    expect(grantedAt3.has('srd-2024:fear')).toBe(false)

    const at9 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'sorc-1',
            classId: 'srd-2024:sorcerer',
            level: 9,
            choices: createValidSorcererSelection(9).choices,
          },
        ],
      }),
      { spellCatalog },
    )
    const grantedAt9 = collectGrantedSpellIds(at9)
    expect(grantedAt9.has('srd-2024:summon-dragon')).toBe(true)
    expect(grantedAt9.has('srd-2024:legend-lore')).toBe(true)
  })

  it('multiclasses Sorcerer + Wizard as full casters for shared slots', () => {
    const contributors = collectSlotContributors(
      [
        {
          instanceId: 'sorc-1',
          classId: 'srd-2024:sorcerer',
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
        [sorcererSrd2024.id, sorcererSrd2024],
        [wizardSrd2024.id, wizardSrd2024],
      ]),
    )
    const slots = resolveSharedSpellSlots(contributors)
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('multiclasses Sorcerer + Bard as summed full casters', () => {
    const slots = resolveSharedSpellSlots(
      collectSlotContributors(
        [
          {
            instanceId: 'sorc-1',
            classId: 'srd-2024:sorcerer',
            level: 2,
            choices: {},
          },
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 2,
            choices: {},
          },
        ],
        new Map([
          [sorcererSrd2024.id, sorcererSrd2024],
          [bardSrd2024.id, bardSrd2024],
        ]),
      ),
    )
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[3])
  })

  it('uses only Sorcerer levels for Sorcerer + Fighter shared slots', () => {
    const slots = resolveSharedSpellSlots(
      collectSlotContributors(
        [
          {
            instanceId: 'sorc-1',
            classId: 'srd-2024:sorcerer',
            level: 5,
            choices: {},
          },
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {},
          },
        ],
        new Map([
          [sorcererSrd2024.id, sorcererSrd2024],
          [fighterSrd2024.id, fighterSrd2024],
        ]),
      ),
    )
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('keeps Sorcerer shared slots separate from pact magic', () => {
    const pact = createTestPactCasterClass()
    const definitionsById = new Map([
      [sorcererSrd2024.id, sorcererSrd2024],
      [pact.id, pact],
    ])
    const instances = [
      {
        instanceId: 'sorc-1',
        classId: 'srd-2024:sorcerer',
        level: 3,
        choices: {},
      },
      {
        instanceId: 'pact-1',
        classId: pact.id,
        level: 2,
        choices: {},
      },
    ]

    const shared = resolveSharedSpellSlots(
      collectSlotContributors(instances, definitionsById),
    )
    const pactSlots = resolvePactMagicSlots(instances, definitionsById)

    expect(shared?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[2])
    expect(pactSlots?.sources).toHaveLength(1)
  })

  it('requires Charisma 13 for Sorcerer multiclass prerequisites', () => {
    expect(
      meetsMulticlassPrerequisite(sorcererSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 12,
      }),
    ).toBe(false)
    expect(
      meetsMulticlassPrerequisite(sorcererSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 13,
      }),
    ).toBe(true)
  })

  it('exposes elemental-affinity only when Draconic Sorcery is selected', () => {
    const withSubclass = getChoicesAvailableAtLevel(sorcererSrd2024, 6, {
      'sorcerer-subclass': 'draconic-sorcery',
    }).map((choice) => choice.id)

    const withoutSubclass = getChoicesAvailableAtLevel(
      sorcererSrd2024,
      6,
      {},
    ).map((choice) => choice.id)

    expect(withSubclass).toContain('elemental-affinity')
    expect(withoutSubclass).not.toContain('elemental-affinity')
  })

  it('prunes Metamagic and Affinity when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      createValidSorcererSelection(10).choices,
      getChoicesAvailableAtLevel(sorcererSrd2024, 2),
    )
    expect(pruned['sorcerer-subclass']).toBeUndefined()
    expect(pruned['elemental-affinity']).toBeUndefined()
    expect(pruned['metamagic-10']).toBeUndefined()
    expect(pruned.metamagic).toBeDefined()
  })

  it('excludes Metamagic options across levels', () => {
    const excluded = getExcludedSharedPoolOptionIds(
      sorcererSrd2024,
      'metamagic-17',
      {
        metamagic: ['careful-spell', 'distant-spell'],
        'metamagic-10': ['empowered-spell', 'extended-spell'],
        'metamagic-17': [],
      },
    )

    expect(excluded).toEqual(
      expect.arrayContaining([
        'careful-spell',
        'distant-spell',
        'empowered-spell',
        'extended-spell',
      ]),
    )
  })

  it('offers a 50 GP gold alternative for starting equipment', () => {
    const entitlement = sorcererSrd2024.startingEquipment.entitlements[0]
    expect(entitlement?.type).toBe('choose-option')
    if (entitlement?.type !== 'choose-option') {
      return
    }

    const gold = entitlement.options.find(
      (option) => option.id === 'gold-alternative',
    )
    expect(gold).toMatchObject({
      id: 'gold-alternative',
      label: '50 GP',
      kind: 'gold',
      goldPieces: 50,
    })
    expect(GOLD_PIECES_ITEM_ID).toBeDefined()
  })

  it('defers starting equipment', () => {
    const deferred = resolveDeferredCharacterRequirements(sorcererSrd2024, 1)
    expect(deferred.map((entry) => entry.id)).toEqual(['starting-equipment'])
  })

  it('persists Sorcerer choices through a JSON round-trip', () => {
    const character = createDefaultCharacter({
      name: 'Sorcerer Save',
      classes: [
        {
          instanceId: 'sorc-1',
          classId: 'srd-2024:sorcerer',
          level: 6,
          choices: createValidSorcererSelection(6).choices,
        },
      ],
    })

    const restored = JSON.parse(JSON.stringify(character)) as typeof character
    expect(restored.classes[0]?.choices.metamagic).toEqual([
      'careful-spell',
      'distant-spell',
    ])
    expect(restored.classes[0]?.choices['elemental-affinity']).toBe('fire')
    expect(restored.classes[0]?.choices['sorcerer-subclass']).toBe(
      'draconic-sorcery',
    )
  })
})
