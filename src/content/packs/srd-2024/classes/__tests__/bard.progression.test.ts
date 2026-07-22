import { describe, expect, it } from 'vitest'
import { bardSrd2024 } from '../bard'
import { wizardSrd2024 } from '../wizard'
import { fighterSrd2024 } from '../fighter'
import { druidSrd2024 } from '../druid'
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
import {
  BARD_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../../../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../../../../../domain/class/epicBoon'
import { getExcludedExpertiseOptionIds } from '../../../../../domain/class/skillProficiencySelections'
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
import {
  BARDIC_INSPIRATION_DIE_BY_LEVEL,
  FULL_CASTER_SLOTS_BY_LEVEL,
} from '../../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../../spell-lists'
import { pruneSpellsNotOnEntitlementList } from '../../../../../rules/spell/pruneSpellsNotOnEntitlementList'
import { validateSpellSourceStates } from '../../../../../rules/spell/validateSpellSourceStates'
import { createTestPactCasterClass } from '../../../../../testing/createTestSpellbookAndPactClasses'
import { GOLD_PIECES_ITEM_ID } from '../../../../../domain/equipment/types'

const FEATURE_IDS_BY_LEVEL: Record<number, readonly string[]> = {
  1: ['bardic-inspiration', 'spellcasting'],
  2: ['expertise', 'jack-of-all-trades'],
  3: ['bard-subclass'],
  4: ['ability-score-improvement-4'],
  5: ['font-of-inspiration'],
  6: ['bard-subclass-feature-6'],
  7: ['countercharm'],
  8: ['ability-score-improvement-8'],
  9: ['expertise-9'],
  10: ['magical-secrets'],
  11: [],
  12: ['ability-score-improvement-12'],
  13: [],
  14: ['bard-subclass-feature-14'],
  15: [],
  16: ['ability-score-improvement-16'],
  17: [],
  18: ['superior-inspiration'],
  19: ['epic-boon'],
  20: ['words-of-creation'],
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

function createValidBardSelection(level: number) {
  const choices: Record<string, string | string[]> = {
    'skill-proficiencies': ['performance', 'persuasion', 'deception'],
    'musical-instruments': ['lute', 'flute', 'drum'],
    ...createAsiChoicesUpToLevel(level, BARD_ASI_FEATURE_LEVELS),
  }

  if (level >= 2) {
    choices.expertise = ['performance', 'persuasion']
  }

  if (level >= 3) {
    choices['bard-subclass'] = 'college-of-lore'
    choices['lore-bonus-proficiencies'] = ['arcana', 'history', 'investigation']
  }

  if (level >= 9) {
    choices['expertise-9'] = ['deception', 'arcana']
  }

  if (level >= 19) {
    choices['epic-boon'] = selectEpicBoonFeat('srd-2024:boon-of-spell-recall')
  }

  return {
    classId: 'srd-2024:bard',
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

function findPreparedEntitlement(
  result: Awaited<ReturnType<typeof resolveCharacterSpellcasting>>,
  instanceId = 'bard-1',
) {
  const group = result.groups.find(
    (entry) => entry.groupId === `class:${instanceId}`,
  )
  return group?.entitlements.find((entry) => entry.entitlementId === 'prepared')
}

describe('bardSrd2024 progression', () => {
  it.each(
    Object.entries(FEATURE_IDS_BY_LEVEL).map(([level, featureIds]) => [
      Number(level),
      featureIds,
    ]),
  )('exposes the expected feature IDs at level %i', (level, featureIds) => {
    expect(
      getClassFeaturesForLevel(bardSrd2024, level as number).map(
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
      getClassFeaturesUpToLevel(bardSrd2024, level as number).map(
        (feature) => feature.id,
      ),
    ).toEqual(featureIds)
    expect(
      getClassFeatureProgressionUpToLevel(bardSrd2024, level as number).flatMap(
        (entry) => entry.features.map((feature) => feature.id),
      ),
    ).toEqual(featureIds)
  })

  it('includes every level from 1 through 20 in feature progression', () => {
    expect(bardSrd2024.featureProgression.map((entry) => entry.level)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
  })

  it('uses ASI feature levels 4, 8, 12, and 16', () => {
    expect(BARD_ASI_FEATURE_LEVELS).toEqual([4, 8, 12, 16])
    for (const asiLevel of BARD_ASI_FEATURE_LEVELS) {
      expect(
        getClassFeaturesForLevel(bardSrd2024, asiLevel).some(
          (feature) => feature.id === `ability-score-improvement-${asiLevel}`,
        ),
      ).toBe(true)
    }
  })

  it('matches the Bardic Inspiration die table', () => {
    expect(BARDIC_INSPIRATION_DIE_BY_LEVEL).toEqual([
      6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12,
    ])
  })

  it('validates a complete selection at each level', () => {
    for (let level = 1; level <= 20; level += 1) {
      const selection = createValidBardSelection(level)
      const result = validateClassSelection(
        selection,
        'srd-2024',
        bardSrd2024,
      )
      expect(result.ok, `level ${level}: ${JSON.stringify(result)}`).toBe(true)
    }
  })

  it('requires expertise and College of Lore when incomplete', () => {
    expect(
      validateClassSelection(
        {
          classId: 'srd-2024:bard',
          level: 3,
          choices: {
            'skill-proficiencies': ['performance', 'persuasion', 'deception'],
            'musical-instruments': ['lute', 'flute', 'drum'],
          },
        },
        'srd-2024',
        bardSrd2024,
      ).ok,
    ).toBe(false)
  })

  it('resolves Jack of All Trades via class effects at level 2+', () => {
    expect(
      resolveClassEffects(bardSrd2024, createValidBardSelection(1)),
    ).not.toContainEqual({ kind: 'jack-of-all-trades' })

    expect(
      resolveClassEffects(bardSrd2024, createValidBardSelection(2)),
    ).toContainEqual({ kind: 'jack-of-all-trades' })

    expect(
      resolveClassEffects(bardSrd2024, createValidBardSelection(10)),
    ).toContainEqual({ kind: 'jack-of-all-trades' })
  })

  it('expands Magical Secrets prepared listId at level 10 but not level 9', async () => {
    const catalog = createBundledClassCatalog()
    const spellCatalog = createBundledSpellCatalog()

    const at9 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 9,
            choices: createValidBardSelection(9).choices,
          },
        ],
      }),
      { spellCatalog },
    )
    const at10 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 10,
            choices: createValidBardSelection(10).choices,
          },
        ],
      }),
      { spellCatalog },
    )

    expect(findPreparedEntitlement(at9)?.listId).toBe(SPELL_LIST_IDS.bard)
    expect(findPreparedEntitlement(at10)?.listId).toBe(
      SPELL_LIST_IDS.magicalSecrets,
    )
  })

  it('prunes Magical Secrets picks when dropping below level 10', async () => {
    const catalog = createBundledClassCatalog()
    const spellCatalog = createBundledSpellCatalog()
    const wizardOnlySpell = 'srd-2024:fireball'

    const at10 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 10,
            choices: createValidBardSelection(10).choices,
          },
        ],
        spellSourceStates: [
          {
            source: {
              kind: 'class-instance',
              instanceId: 'bard-1',
              entitlementId: 'prepared',
            },
            selections: [{ spellId: wizardOnlySpell }],
          },
        ],
      }),
      { spellCatalog },
    )

    expect(findPreparedEntitlement(at10)?.listSpellIds).toContain(wizardOnlySpell)

    const at9 = await resolveCharacterSpellcasting(
      catalog,
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 9,
            choices: createValidBardSelection(9).choices,
          },
        ],
        spellSourceStates: [
          {
            source: {
              kind: 'class-instance',
              instanceId: 'bard-1',
              entitlementId: 'prepared',
            },
            selections: [{ spellId: wizardOnlySpell }],
          },
        ],
      }),
      { spellCatalog },
    )

    expect(findPreparedEntitlement(at9)?.listSpellIds).not.toContain(
      wizardOnlySpell,
    )

    const pruned = pruneSpellsNotOnEntitlementList(
      [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'bard-1',
            entitlementId: 'prepared',
          },
          selections: [{ spellId: wizardOnlySpell }],
        },
      ],
      at9,
    )

    expect(pruned[0]?.selections).toEqual([])
  })

  it('grants Words of Creation spells at level 20', async () => {
    const resolved = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 20,
            choices: createValidBardSelection(20).choices,
          },
        ],
      }),
      { spellCatalog: createBundledSpellCatalog() },
    )

    const granted = collectGrantedSpellIds(resolved)
    expect(granted.has('srd-2024:power-word-heal')).toBe(true)
    expect(granted.has('srd-2024:power-word-kill')).toBe(true)
  })

  it('does not grant Words of Creation below level 20', async () => {
    const resolved = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 19,
            choices: createValidBardSelection(19).choices,
          },
        ],
      }),
      { spellCatalog: createBundledSpellCatalog() },
    )

    const granted = collectGrantedSpellIds(resolved)
    expect(granted.has('srd-2024:power-word-heal')).toBe(false)
    expect(granted.has('srd-2024:power-word-kill')).toBe(false)
  })

  it('multiclasses Bard + Wizard as full casters for shared slots', () => {
    const contributors = collectSlotContributors(
      [
        {
          instanceId: 'bard-1',
          classId: 'srd-2024:bard',
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
        [bardSrd2024.id, bardSrd2024],
        [wizardSrd2024.id, wizardSrd2024],
      ]),
    )
    const slots = resolveSharedSpellSlots(contributors)
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('uses only Bard levels for Bard + Fighter shared slots', () => {
    const contributors = collectSlotContributors(
      [
        {
          instanceId: 'bard-1',
          classId: 'srd-2024:bard',
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
        [bardSrd2024.id, bardSrd2024],
        [fighterSrd2024.id, fighterSrd2024],
      ]),
    )
    const slots = resolveSharedSpellSlots(contributors)
    expect(slots?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('multiclasses Bard + Druid or Cleric as summed full casters', () => {
    const bardDruid = resolveSharedSpellSlots(
      collectSlotContributors(
        [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 2,
            choices: {},
          },
          {
            instanceId: 'druid-1',
            classId: 'srd-2024:druid',
            level: 2,
            choices: {},
          },
        ],
        new Map([
          [bardSrd2024.id, bardSrd2024],
          [druidSrd2024.id, druidSrd2024],
        ]),
      ),
    )
    const bardCleric = resolveSharedSpellSlots(
      collectSlotContributors(
        [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 2,
            choices: {},
          },
          {
            instanceId: 'cleric-1',
            classId: 'srd-2024:cleric',
            level: 2,
            choices: {},
          },
        ],
        new Map([
          [bardSrd2024.id, bardSrd2024],
          [clericSrd2024.id, clericSrd2024],
        ]),
      ),
    )

    expect(bardDruid?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[3])
    expect(bardCleric?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[3])
  })

  it('keeps Bard shared slots separate from pact magic', () => {
    const pact = createTestPactCasterClass()
    const definitionsById = new Map([
      [bardSrd2024.id, bardSrd2024],
      [pact.id, pact],
    ])
    const instances = [
      {
        instanceId: 'bard-1',
        classId: 'srd-2024:bard',
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
    expect(pactSlots?.sources[0]).toMatchObject({
      instanceId: 'pact-1',
      slotCount: 2,
      slotLevel: 1,
    })
  })

  it('requires Charisma 13 for Bard multiclass prerequisites', () => {
    expect(
      meetsMulticlassPrerequisite(bardSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 12,
      }),
    ).toBe(false)
    expect(
      meetsMulticlassPrerequisite(bardSrd2024.multiclassPrerequisite, {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 13,
      }),
    ).toBe(true)
  })

  it('isolates Magical Discoveries from prepared spell selections', async () => {
    const catalog = createBundledClassCatalog()
    const spellCatalog = createBundledSpellCatalog()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'bard-1',
          classId: 'srd-2024:bard',
          level: 6,
          choices: createValidBardSelection(6).choices,
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'bard-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:charm-person' },
            { spellId: 'srd-2024:healing-word' },
            { spellId: 'srd-2024:dissonant-whispers' },
            { spellId: 'srd-2024:faerie-fire' },
            { spellId: 'srd-2024:invisibility' },
            { spellId: 'srd-2024:suggestion' },
            { spellId: 'srd-2024:hypnotic-pattern' },
            { spellId: 'srd-2024:major-image' },
            { spellId: 'srd-2024:fear' },
            { spellId: 'srd-2024:dispel-magic' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'bard-1',
            entitlementId: 'magical-discoveries',
          },
          selections: [
            { spellId: 'srd-2024:fireball' },
            { spellId: 'srd-2024:magic-missile' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(catalog, character, {
      spellCatalog,
    })
    const group = summary.groups.find(
      (entry) => entry.groupId === 'class:bard-1',
    )
    const prepared = group?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    const discoveries = group?.entitlements.find(
      (entry) => entry.entitlementId === 'magical-discoveries',
    )

    expect(prepared?.listId).toBe(SPELL_LIST_IDS.bard)
    expect(prepared?.listSpellIds).not.toContain('srd-2024:fireball')
    expect(discoveries?.listId).toBe(SPELL_LIST_IDS.magicalDiscoveries)
    expect(discoveries?.listSpellIds).toContain('srd-2024:fireball')
    expect(discoveries?.countsAgainstLimit).toBe(false)
    expect(discoveries?.limit).toBe(2)

    const discoveryState = character.spellSourceStates.find(
      (state) =>
        state.source.kind === 'class-instance' &&
        state.source.entitlementId === 'magical-discoveries',
    )
    expect(discoveryState?.selections.map((entry) => entry.spellId)).toEqual([
      'srd-2024:fireball',
      'srd-2024:magic-missile',
    ])
  })

  it('blocks finish when Magical Discoveries is incomplete', async () => {
    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      createDefaultCharacter({
        classes: [
          {
            instanceId: 'bard-1',
            classId: 'srd-2024:bard',
            level: 6,
            choices: createValidBardSelection(6).choices,
          },
        ],
        spellSourceStates: [
          {
            source: {
              kind: 'class-instance',
              instanceId: 'bard-1',
              entitlementId: 'magical-discoveries',
            },
            selections: [{ spellId: 'srd-2024:fireball' }],
          },
        ],
      }),
      { spellCatalog: createBundledSpellCatalog() },
    )

    const validation = await validateSpellSourceStates(
      summary,
      [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'bard-1',
            entitlementId: 'magical-discoveries',
          },
          selections: [{ spellId: 'srd-2024:fireball' }],
        },
      ],
      createBundledSpellCatalog(),
    )

    expect(validation.ok).toBe(false)
    if (validation.ok) {
      return
    }
    expect(
      validation.issues.some(
        (issue) =>
          issue.code === 'under-limit' &&
          issue.entitlementId === 'magical-discoveries',
      ),
    ).toBe(true)
  })

  it('offers a 90 GP gold alternative for starting equipment', () => {
    const entitlement = bardSrd2024.startingEquipment.entitlements[0]
    expect(entitlement?.type).toBe('choose-option')
    if (entitlement?.type !== 'choose-option') {
      return
    }

    const gold = entitlement.options.find(
      (option) => option.id === 'gold-alternative',
    )
    expect(gold).toMatchObject({
      id: 'gold-alternative',
      label: '90 GP',
      kind: 'gold',
      goldPieces: 90,
    })
    expect(GOLD_PIECES_ITEM_ID).toBeDefined()
  })

  it('allows expertise on a background skill not in class picks', () => {
    const excluded = getExcludedExpertiseOptionIds(
      bardSrd2024,
      'expertise',
      {
        'skill-proficiencies': ['performance', 'persuasion', 'deception'],
        expertise: [],
      },
      ['performance', 'persuasion', 'deception', 'athletics'],
    )

    expect(excluded).not.toContain('athletics')
    expect(excluded).toContain('stealth')
  })

  it('exposes lore-bonus-proficiencies only when College of Lore is selected', () => {
    const withSubclass = getChoicesAvailableAtLevel(bardSrd2024, 3, {
      'bard-subclass': 'college-of-lore',
    }).map((choice) => choice.id)

    const withoutSubclass = getChoicesAvailableAtLevel(
      bardSrd2024,
      3,
      {},
    ).map((choice) => choice.id)

    expect(withSubclass).toContain('lore-bonus-proficiencies')
    expect(withoutSubclass).not.toContain('lore-bonus-proficiencies')
  })

  it('prunes higher-level choices when lowering level', () => {
    const pruned = pruneClassChoicesForLevel(
      createValidBardSelection(9).choices,
      getChoicesAvailableAtLevel(bardSrd2024, 2),
    )
    expect(pruned['bard-subclass']).toBeUndefined()
    expect(pruned['lore-bonus-proficiencies']).toBeUndefined()
    expect(pruned['expertise-9']).toBeUndefined()
    expect(pruned.expertise).toBeDefined()
    expect(pruned['musical-instruments']).toBeDefined()
  })

  it('defers starting equipment', () => {
    const deferred = resolveDeferredCharacterRequirements(bardSrd2024, 1)
    expect(deferred.map((entry) => entry.id)).toEqual(['starting-equipment'])
  })
})
