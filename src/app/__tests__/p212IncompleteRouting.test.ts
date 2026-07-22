import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledEquipmentCatalog } from '../../adapters/bundledEquipmentCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../adapters/bundledSpellCatalog'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../domain/character/defaults'
import {
  GOLD_OPTION_ID,
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../domain/equipment/startingEquipmentHelpers'
import {
  EMPTY_CHARACTER_INVENTORY,
  EMPTY_EQUIPMENT_LOADOUT,
} from '../../domain/equipment/types'
import type { Character } from '../../domain/types'
import { createFeatGrantChoiceStorageKey } from '../../domain/feat/featGrantChoiceStorage'
import { autofillSpellSourceStates } from '../../testing/autofillSpellSourceStates'
import { buildLegalClassInstance } from '../../testing/srdLegalClassChoices'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'
import { resolveCharacterSpellcasting } from '../../rules/character/resolveCharacterSpellcasting'
import { validateClassInstance } from '../../rules/class/classRules'
import { validateCharacterClassesWithDefinitions } from '../../rules/class/validateCharacterClasses'
import { getCharacterOpenDestination } from '../wizard/resolveCharacterStepLanding'
import type { WizardStepId } from '../wizard/types'

const catalogs = {
  speciesCatalog: createBundledSpeciesCatalog(),
  classCatalog: createBundledClassCatalog(),
  backgroundCatalog: createBundledBackgroundCatalog(),
  featCatalog: createBundledFeatCatalog(),
  spellCatalog: createBundledSpellCatalog(),
  equipmentCatalog: createBundledEquipmentCatalog(),
}

function soldierBackground(): NonNullable<Character['background']> {
  return {
    backgroundId: 'srd-2024:soldier',
    abilityScoreIncrease: {
      mode: 'two-and-one',
      plusTwo: 'strength',
      plusOne: 'constitution',
    },
    choices: { 'gaming-set': 'dice-set' },
  }
}

function equipmentFor(
  classInstanceIds: string | readonly string[],
  backgroundId: string,
  includeClass = true,
): Character['equipment'] {
  const instanceIds = Array.isArray(classInstanceIds)
    ? classInstanceIds
    : [classInstanceIds]
  return {
    selections: [
      ...(includeClass
        ? instanceIds.map((instanceId) => ({
            source: {
              kind: 'class-instance' as const,
              instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [] as string[],
            optionId: GOLD_OPTION_ID,
            choices: [],
          }))
        : []),
      {
        source: { kind: 'background', backgroundId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        path: [],
        optionId: PACKAGE_OPTION_ID,
        choices: [],
      },
      {
        source: { kind: 'background', backgroundId },
        entitlementId: 'gaming-set',
        path: [PACKAGE_OPTION_ID],
        optionId: null,
        choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
      },
    ],
    loadout: EMPTY_EQUIPMENT_LOADOUT,
    inventory: EMPTY_CHARACTER_INVENTORY,
  }
}

async function withAutofilledSpells(character: Character): Promise<Character> {
  let spellcasting = await resolveCharacterSpellcasting(
    catalogs.classCatalog,
    character,
    {
      featCatalog: catalogs.featCatalog,
      backgroundCatalog: catalogs.backgroundCatalog,
      spellCatalog: catalogs.spellCatalog,
      speciesCatalog: catalogs.speciesCatalog,
    },
  )
  if (!spellcasting.hasSpellContent) {
    return character
  }
  let states = await autofillSpellSourceStates(
    spellcasting,
    catalogs.spellCatalog,
  )
  character = { ...character, spellSourceStates: states }
  spellcasting = await resolveCharacterSpellcasting(
    catalogs.classCatalog,
    character,
    {
      featCatalog: catalogs.featCatalog,
      backgroundCatalog: catalogs.backgroundCatalog,
      spellCatalog: catalogs.spellCatalog,
      speciesCatalog: catalogs.speciesCatalog,
    },
  )
  states = await autofillSpellSourceStates(
    spellcasting,
    catalogs.spellCatalog,
    states,
  )
  return { ...character, spellSourceStates: states }
}

async function legalFighter(level: 1 | 3 | 20 = 1): Promise<Character> {
  const classInstance = buildLegalClassInstance('fighter', level)
  return createDefaultCharacter({
    id: `incomplete-fighter-${level}`,
    name: 'Routing Fighter',
    creationMethod: 'manual',
    abilityScores: {
      strength: 15,
      dexterity: 14,
      constitution: 14,
      intelligence: 12,
      wisdom: 13,
      charisma: 12,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(classInstance),
    background: soldierBackground(),
    equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
  })
}

async function legalWizard(level: 1 | 3 | 20 = 3): Promise<Character> {
  const classInstance = buildLegalClassInstance('wizard', level)
  let character = createDefaultCharacter({
    id: `incomplete-wizard-${level}`,
    name: 'Routing Wizard',
    creationMethod: 'manual',
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 14,
      intelligence: 15,
      wisdom: 12,
      charisma: 10,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(classInstance),
    background: soldierBackground(),
    equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
    spellSourceStates: [],
  })
  return withAutofilledSpells(character)
}

async function legalSorcerer(level: 3 | 20 = 3): Promise<Character> {
  const classInstance = buildLegalClassInstance('sorcerer', level)
  let character = createDefaultCharacter({
    id: `incomplete-sorcerer-${level}`,
    name: 'Routing Sorcerer',
    creationMethod: 'manual',
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 15,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(classInstance),
    background: soldierBackground(),
    equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
    spellSourceStates: [],
  })
  return withAutofilledSpells(character)
}

async function legalWarlock(level: 3 | 20 = 3): Promise<Character> {
  const classInstance = buildLegalClassInstance('warlock', level)
  let character = createDefaultCharacter({
    id: `incomplete-warlock-${level}`,
    name: 'Routing Warlock',
    creationMethod: 'manual',
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 15,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(classInstance),
    background: soldierBackground(),
    equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
    spellSourceStates: [],
  })
  return withAutofilledSpells(character)
}

async function expectDestination(
  character: Character,
  step: WizardStepId,
): Promise<void> {
  await expect(getCharacterOpenDestination(character, catalogs)).resolves.toBe(
    step,
  )
}

describe('P2.12 incomplete-build routing matrix', () => {
  it('routes a complete single-class character to Overview', async () => {
    await expectDestination(await legalFighter(1), 'review')
  })

  it('routes missing class skills to Class', async () => {
    const character = await legalFighter(1)
    const instance = character.classes[0]!
    const { 'skill-proficiencies': _removed, ...choices } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [{ ...instance, choices }],
      },
      'class',
    )
  })

  it('routes missing subclass to Class', async () => {
    const character = await legalFighter(3)
    const instance = character.classes[0]!
    const { 'fighter-subclass': _removed, ...choices } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [{ ...instance, choices }],
      },
      'class',
    )
  })

  it('routes missing species to Species', async () => {
    await expectDestination(
      { ...(await legalFighter(1)), species: null },
      'species',
    )
  })

  it('routes incomplete species choice to Species', async () => {
    await expectDestination(
      {
        ...(await legalFighter(1)),
        species: {
          speciesId: 'srd-2024:elf',
          lineageId: null,
          choices: {},
        },
      },
      'species',
    )
  })

  it('routes missing background to Background', async () => {
    await expectDestination(
      { ...(await legalFighter(1)), background: null },
      'background',
    )
  })

  it('routes missing ASI allocation to Class', async () => {
    const classInstance = buildLegalClassInstance('fighter', 3)
    classInstance.level = 4
    const characterAt4 = createDefaultCharacter({
      id: 'incomplete-asi',
      name: 'ASI Gap',
      creationMethod: 'manual',
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 14,
        intelligence: 12,
        wisdom: 13,
        charisma: 12,
      },
      species: { ...COMPLETE_DWARF_SELECTION },
      ...withSingleClassInstance(classInstance),
      background: soldierBackground(),
      equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
    })
    await expectDestination(characterAt4, 'class')
  })

  it('routes missing nested Epic Boon ASI to Class', async () => {
    const character = await legalFighter(20)
    const instance = character.classes[0]!
    const nestedKey = createFeatGrantChoiceStorageKey(
      'epic-boon',
      'ability-score-increase',
    )
    const { [nestedKey]: _removed, ...choices } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [{ ...instance, choices }],
      },
      'class',
    )
  })

  it('routes missing spell selections to Spells', async () => {
    const character = await legalWizard(3)
    await expectDestination(
      { ...character, spellSourceStates: [] },
      'spells',
    )
  })

  it('routes missing Metamagic to Class', async () => {
    const character = await legalSorcerer(3)
    const instance = character.classes[0]!
    const { metamagic: _removed, ...choices } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [{ ...instance, choices }],
      },
      'class',
    )
  })

  it('routes missing invocations to Class', async () => {
    const character = await legalWarlock(3)
    const instance = character.classes[0]!
    const { 'eldritch-invocations': _removed, ...choices } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [{ ...instance, choices }],
      },
      'class',
    )
  })

  it('routes missing Pact Blade nested selection to Class', async () => {
    const character = await legalWarlock(3)
    const instance = character.classes[0]!
    const invocations = Array.isArray(instance.choices['eldritch-invocations'])
      ? (instance.choices['eldritch-invocations'] as string[])
      : []
    const withBlade = invocations.includes('pact-of-the-blade')
      ? invocations
      : [...invocations.slice(0, -1), 'pact-of-the-blade']
    const { 'pact-blade-weapon': _removed, ...rest } = instance.choices
    await expectDestination(
      {
        ...character,
        classes: [
          {
            ...instance,
            choices: {
              ...rest,
              'eldritch-invocations': withBlade,
            },
          },
        ],
      },
      'class',
    )
  })

  it('routes missing Mystic Arcanum to Spells', async () => {
    const character = await legalWarlock(20)
    const withoutArcanum = character.spellSourceStates.filter(
      (state) => !state.source.entitlementId.startsWith('mystic-arcanum'),
    )
    await expectDestination(
      { ...character, spellSourceStates: withoutArcanum },
      'spells',
    )
  })

  it('routes missing equipment to Equipment', async () => {
    const character = await legalFighter(1)
    await expectDestination(
      {
        ...character,
        equipment: equipmentFor(
          character.classes[0]!.instanceId,
          'srd-2024:soldier',
          false,
        ),
      },
      'equipment',
    )
  })

  it('routes invalid multiclass prerequisites to Class', async () => {
    const fighter = buildLegalClassInstance('fighter', 1)
    const wizard = buildLegalClassInstance('wizard', 1)
    const character = createDefaultCharacter({
      id: 'incomplete-multiclass',
      name: 'Weak Multiclass',
      creationMethod: 'manual',
      abilityScores: {
        strength: 13,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      },
      species: { ...COMPLETE_DWARF_SELECTION },
      classes: [fighter, wizard],
      startingClassInstanceId: fighter.instanceId,
      targetLevel: 2,
      background: soldierBackground(),
      equipment: equipmentFor(
        [fighter.instanceId, wizard.instanceId],
        'srd-2024:soldier',
      ),
      spellSourceStates: [],
    })

    const fighterDef = await catalogs.classCatalog.getClass(fighter.classId)
    const wizardDef = await catalogs.classCatalog.getClass(wizard.classId)
    const definitions = new Map([
      [fighter.classId, fighterDef!],
      [wizard.classId, wizardDef!],
    ])
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: character.classes,
        startingClassInstanceId: character.startingClassInstanceId,
        targetLevel: character.targetLevel,
        editionId: character.editionId,
        abilityScores: character.abilityScores,
      },
      (classId) => definitions.get(classId) ?? null,
    )
    expect(result.status).not.toBe('complete')
    expect(
      result.issues.some(
        (error) => error.code === 'multiclass-ability-prerequisite',
      ),
    ).toBe(true)

    await expectDestination(character, 'class')
  })

  it('routes duplicate non-repeatable feat selection to Class', async () => {
    // Soldier grants Savage Attacker; ASI feat-mode picking the same feat is illegal.
    const classInstance = buildLegalClassInstance('fighter', 3)
    classInstance.level = 4
    classInstance.choices['ability-score-improvement-4'] = {
      mode: 'feat',
      featId: 'srd-2024:savage-attacker',
    }
    const character = createDefaultCharacter({
      id: 'incomplete-dup-feat',
      name: 'Dup Feat',
      creationMethod: 'manual',
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 14,
        intelligence: 12,
        wisdom: 13,
        charisma: 12,
      },
      species: { ...COMPLETE_DWARF_SELECTION },
      ...withSingleClassInstance(classInstance),
      background: soldierBackground(),
      equipment: equipmentFor(classInstance.instanceId, 'srd-2024:soldier'),
    })

    const definition = await catalogs.classCatalog.getClass(
      classInstance.classId,
    )
    const feats = await catalogs.featCatalog.listFeats('srd-2024')
    const validation = validateClassInstance(
      classInstance,
      'srd-2024',
      definition!,
      {
        featById: new Map(feats.map((feat) => [feat.id, feat])),
        takenFeatIds: ['srd-2024:savage-attacker'],
        eligibilityContext: {
          characterLevel: 4,
          abilityScores: character.abilityScores,
          hasSpellcasting: false,
          hasFightingStyle: true,
          takenFeatIds: ['srd-2024:savage-attacker'],
        },
      },
    )
    expect(validation.ok).toBe(false)

    await expectDestination(character, 'class')
  })

  it('routes stale inactive spell source state to Spells', async () => {
    const character = await legalWizard(3)
    await expectDestination(
      {
        ...character,
        spellSourceStates: [
          ...character.spellSourceStates,
          {
            source: {
              kind: 'class-instance',
              instanceId: character.classes[0]!.instanceId,
              entitlementId: 'stale-removed-entitlement',
            },
            selections: [{ spellId: 'srd-2024:magic-missile' }],
          },
        ],
      },
      'spells',
    )
  })

  it('routes illegal spell duplicates to Spells', async () => {
    const character = await legalWizard(3)
    const prepared = character.spellSourceStates.find(
      (state) => state.source.entitlementId === 'prepared',
    )
    expect(prepared).toBeDefined()
    const spellId = prepared!.selections[0]?.spellId
    expect(spellId).toBeDefined()
    await expectDestination(
      {
        ...character,
        spellSourceStates: character.spellSourceStates.map((state) =>
          state.source.entitlementId === 'prepared'
            ? {
                ...state,
                selections: [
                  ...state.selections,
                  { spellId: spellId! },
                ],
              }
            : state,
        ),
      },
      'spells',
    )
  })

  it('still routes to Overview when only Phase 3 descriptive features remain', async () => {
    // Legal L20 warlock includes descriptive Magical Cunning / temp HP text —
    // those must not block Finish or Overview routing.
    await expectDestination(await legalWarlock(20), 'review')
  })

  it('routes a complete multiclass character to Overview when prereqs are met', async () => {
    const fighter = buildLegalClassInstance('fighter', 1)
    const wizard = buildLegalClassInstance('wizard', 1)
    let character = createDefaultCharacter({
      id: 'complete-multiclass',
      name: 'Legal Multiclass',
      creationMethod: 'manual',
      abilityScores: {
        strength: 13,
        dexterity: 14,
        constitution: 14,
        intelligence: 13,
        wisdom: 12,
        charisma: 10,
      },
      species: { ...COMPLETE_DWARF_SELECTION },
      classes: [fighter, wizard],
      startingClassInstanceId: fighter.instanceId,
      targetLevel: 2,
      background: soldierBackground(),
      equipment: equipmentFor(
        [fighter.instanceId, wizard.instanceId],
        'srd-2024:soldier',
      ),
      spellSourceStates: [],
    })
    character = await withAutofilledSpells(character)
    await expectDestination(character, 'review')
  })
})
