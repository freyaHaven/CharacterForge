import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledEquipmentCatalog } from '../../adapters/bundledEquipmentCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../adapters/bundledSpellCatalog'
import { parseCharacterFile } from '../../adapters/characterFile'
import { serializeCharacterFile } from '../../adapters/characterFile/serializeCharacterFile'
import {
  CURRENT_SCHEMA_VERSION,
} from '../../adapters/storage/storedCharacter'
import { serializeCharacter } from '../../adapters/storage/serializeCharacter'
import { migrateToCurrentSchema } from '../../adapters/storage/migrations'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../domain/character/defaults'
import {
  GOLD_OPTION_ID,
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../domain/equipment/startingEquipmentHelpers'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../domain/equipment/types'
import type { Character } from '../../domain/types'
import { getFinishPolicyResult } from '../characterFinishPolicy'
import { autofillSpellSourceStates } from '../../testing/autofillSpellSourceStates'
import {
  ALL_SRD_CLASS_KEYS,
  buildLegalClassInstance,
  type LegalClassLevel,
} from '../../testing/srdLegalClassChoices'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'
import { resolveCharacterSpellcasting } from '../../rules/character/resolveCharacterSpellcasting'
import { validateSpellSourceStates } from '../../rules/spell/validateSpellSourceStates'
import { validateClassInstance } from '../../rules/class/classRules'
import { getCharacterOpenDestination } from '../wizard/resolveCharacterStepLanding'
import { getAllStepStatuses } from '../wizard/stepStatus'
import {
  buildCommittedStepValidationContext,
} from '../wizard/resolveCharacterStepLanding'

const catalogs = {
  speciesCatalog: createBundledSpeciesCatalog(),
  classCatalog: createBundledClassCatalog(),
  backgroundCatalog: createBundledBackgroundCatalog(),
  featCatalog: createBundledFeatCatalog(),
  spellCatalog: createBundledSpellCatalog(),
  equipmentCatalog: createBundledEquipmentCatalog(),
}

function createSoldierBackground(): NonNullable<Character['background']> {
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

function createStartingEquipment(
  classInstanceId: string,
  backgroundId: string,
): Character['equipment'] {
  // Gold alternative avoids class-specific nested package choices (bard
  // instrument, monk artisan tools) while still resolving starting equipment.
  return {
    selections: [
      {
        source: { kind: 'class-instance', instanceId: classInstanceId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        path: [],
        optionId: GOLD_OPTION_ID,
        choices: [],
      },
      {
        source: { kind: 'background', backgroundId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        path: [],
        optionId: PACKAGE_OPTION_ID,
        choices: [],
      },
      ...(backgroundId === 'srd-2024:soldier'
        ? [
            {
              source: {
                kind: 'background' as const,
                backgroundId,
              },
              entitlementId: 'gaming-set',
              path: [PACKAGE_OPTION_ID],
              optionId: null,
              choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
            },
          ]
        : []),
    ],
    loadout: EMPTY_EQUIPMENT_LOADOUT,
  }
}

async function buildLegalCharacter(
  classKey: (typeof ALL_SRD_CLASS_KEYS)[number],
  level: LegalClassLevel,
): Promise<Character> {
  const classInstance = buildLegalClassInstance(classKey, level)
  const classDefinition = await catalogs.classCatalog.getClass(
    classInstance.classId,
  )
  expect(classDefinition).not.toBeNull()

  const featList = await catalogs.featCatalog.listFeats('srd-2024')
  const featById = new Map(featList.map((feat) => [feat.id, feat]))

  const classValidation = validateClassInstance(
    classInstance,
    'srd-2024',
    classDefinition!,
    {
      featById,
      eligibilityContext: {
        characterLevel: level,
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 14,
          intelligence: 12,
          wisdom: 13,
          charisma: 12,
        },
        hasSpellcasting: classDefinition!.spellcasting !== undefined,
        hasFightingStyle: true,
        takenFeatIds: [],
      },
    },
  )
  expect(classValidation.ok, `${classKey} L${level} class`).toBe(true)

  let character = createDefaultCharacter({
    id: `legal-${classKey}-${level}`,
    name: `Legal ${classKey} ${level}`,
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
    background: createSoldierBackground(),
    equipment: createStartingEquipment(
      classInstance.instanceId,
      'srd-2024:soldier',
    ),
    spellSourceStates: [],
  })

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

  if (spellcasting.hasSpellContent) {
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
    character = { ...character, spellSourceStates: states }

    const spellValidation = await validateSpellSourceStates(
      spellcasting,
      character.spellSourceStates,
      catalogs.spellCatalog,
    )
    expect(spellValidation, `${classKey} L${level} spells`).toEqual({ ok: true })
  }

  return character
}

async function assertFinishAndOverview(character: Character): Promise<void> {
  const destination = await getCharacterOpenDestination(character, catalogs)
  expect(destination).toBe('review')

  const baseContext = await buildCommittedStepValidationContext(
    character,
    catalogs,
  )
  const spellcasting = await resolveCharacterSpellcasting(
    catalogs.classCatalog,
    character,
    {
      featCatalog: catalogs.featCatalog,
      backgroundCatalog: catalogs.backgroundCatalog,
      spellCatalog: catalogs.spellCatalog,
      speciesCatalog: catalogs.speciesCatalog,
    },
  )
  const spellValidation = spellcasting.hasSpellContent
    ? await validateSpellSourceStates(
        spellcasting,
        character.spellSourceStates,
        catalogs.spellCatalog,
      )
    : null

  const stepStatuses = getAllStepStatuses({
    ...baseContext,
    spellValidation,
    committedSpellsValid:
      !spellcasting.hasSpellContent ||
      spellValidation === null ||
      spellValidation.ok,
    committedEquipmentValid: true,
  })

  const finish = getFinishPolicyResult(stepStatuses, [], {
    requireCompleteSpells: spellcasting.hasSpellContent,
  })
  expect(finish.canFinish).toBe(true)
}

describe('P2.12 legal-build matrix', () => {
  it.each(ALL_SRD_CLASS_KEYS)(
    'finishes a legal level-1 %s and round-trips persistence',
    async (classKey) => {
      const character = await buildLegalCharacter(classKey, 1)
      await assertFinishAndOverview(character)

      const serialized = serializeCharacter(character)
      const migrated = migrateToCurrentSchema(JSON.parse(serialized))
      expect(migrated.ok).toBe(true)
      if (migrated.ok) {
        expect(migrated.envelope.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(migrated.envelope.character.name).toBe(character.name)
      }

      const fileText = serializeCharacterFile(character)
      const parsed = parseCharacterFile(fileText)
      expect(parsed.ok).toBe(true)
      if (parsed.ok) {
        expect(parsed.character.classes[0]?.classId).toBe(
          `srd-2024:${classKey}`,
        )
      }
    },
  )

  it.each(ALL_SRD_CLASS_KEYS)(
    'finishes a legal subclass-level %s',
    async (classKey) => {
      const character = await buildLegalCharacter(classKey, 3)
      await assertFinishAndOverview(character)
    },
  )

  it.each([
    'fighter',
    'barbarian',
    'rogue',
    'wizard',
    'warlock',
    'sorcerer',
  ] as const)('finishes a legal level-20 %s', async (classKey) => {
    const character = await buildLegalCharacter(classKey, 20)
    await assertFinishAndOverview(character)
  })
})
