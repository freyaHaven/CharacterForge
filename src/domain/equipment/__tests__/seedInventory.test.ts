import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledEquipmentCatalog } from '../../../adapters/bundledEquipmentCatalog'
import { serializeCharacterFile } from '../../../adapters/characterFile/serializeCharacterFile'
import { parseCharacterFile } from '../../../adapters/characterFile/parseCharacterFile'
import { migrateToCurrentSchema } from '../../../adapters/storage/migrations'
import { CURRENT_SCHEMA_VERSION } from '../../../adapters/storage/storedCharacter'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { withSingleClassInstance } from '../../character/characterClassSelection'
import { createDefaultCharacter } from '../../character/defaults'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../startingEquipmentHelpers'
import {
  EMPTY_CHARACTER_INVENTORY,
  EMPTY_EQUIPMENT_LOADOUT,
} from '../types'
import {
  seedInventoryFromResolvedEntries,
  shouldSeedInventoryFromResolved,
} from '../seedInventory'
import { resolveCharacterEquipment } from '../../../rules/character/resolveCharacterEquipment'
import {
  buildPlayResolvedEquipmentView,
  trySeedInventoryFromResolvedEquipment,
} from '../../../rules/equipment/seedCharacterInventory'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'

const classCatalog = createBundledClassCatalog()
const backgroundCatalog = createBundledBackgroundCatalog()
const equipmentCatalog = createBundledEquipmentCatalog()

function createFighterWithPackageA() {
  const fighter = createTestFighterClassInstance()
  return createDefaultCharacter({
    name: 'Seed Test',
    ...withSingleClassInstance(fighter),
    background: {
      backgroundId: 'srd-2024:soldier',
      abilityScoreIncrease: {
        mode: 'two-and-one',
        plusTwo: 'strength',
        plusOne: 'constitution',
      },
      choices: { 'gaming-set': 'dice-set' },
    },
    equipment: {
      selections: [
        {
          source: {
            kind: 'class-instance',
            instanceId: fighter.instanceId,
          },
          entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
          path: [],
          optionId: 'package-a',
          choices: [],
        },
        {
          source: {
            kind: 'background',
            backgroundId: 'srd-2024:soldier',
          },
          entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
          path: [],
          optionId: PACKAGE_OPTION_ID,
          choices: [],
        },
        {
          source: {
            kind: 'background',
            backgroundId: 'srd-2024:soldier',
          },
          entitlementId: 'gaming-set',
          path: [PACKAGE_OPTION_ID],
          optionId: null,
          choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
        },
      ],
      loadout: EMPTY_EQUIPMENT_LOADOUT,
    },
  })
}

describe('seedInventory', () => {
  it('seeds once from a complete resolution and refuses to reseed', async () => {
    const character = createFighterWithPackageA()
    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )

    expect(resolved.entries.length).toBeGreaterThan(0)
    expect(
      shouldSeedInventoryFromResolved(character.equipment.inventory, {
        hasEquipmentSources: true,
        sourcesComplete: true,
      }),
    ).toBe(true)

    const seeded = trySeedInventoryFromResolvedEquipment(
      character.equipment.inventory,
      resolved,
    )
    expect(seeded).not.toBeNull()
    expect(seeded!.seededFromStartingEquipment).toBe(true)
    expect(seeded!.entries).toHaveLength(resolved.entries.length)
    expect(seeded!.currency.goldPieces).toBe(resolved.currency.goldPieces)

    expect(trySeedInventoryFromResolvedEquipment(seeded!, resolved)).toBeNull()
    expect(
      shouldSeedInventoryFromResolved(seeded!, {
        hasEquipmentSources: true,
        sourcesComplete: true,
      }),
    ).toBe(false)
  })

  it('does not seed when starting equipment is incomplete', async () => {
    const fighter = createTestFighterClassInstance()
    const character = createDefaultCharacter({
      ...withSingleClassInstance(fighter),
      equipment: {
        selections: [],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    })

    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )

    expect(resolved.sources.length).toBeGreaterThan(0)
    expect(
      trySeedInventoryFromResolvedEquipment(
        character.equipment.inventory,
        resolved,
      ),
    ).toBeNull()
  })

  it('does not seed when there are no equipment sources', () => {
    expect(
      shouldSeedInventoryFromResolved(EMPTY_CHARACTER_INVENTORY, {
        hasEquipmentSources: false,
        sourcesComplete: true,
      }),
    ).toBe(false)
  })

  it('keeps persisted inventory when starting resolution would differ', async () => {
    const character = createFighterWithPackageA()
    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )
    const seeded = seedInventoryFromResolvedEntries(
      resolved.entries,
      resolved.currency.goldPieces,
    )

    const diverged = {
      ...seeded,
      entries: [
        ...seeded.entries,
        {
          instanceId: 'custom:loot:0',
          itemId: 'srd-2024:torch',
          quantity: 3,
          location: { kind: 'carried' as const },
        },
      ],
      currency: { goldPieces: seeded.currency.goldPieces + 50 },
    }

    const again = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      {
        ...character,
        equipment: {
          ...character.equipment,
          inventory: diverged,
          selections: character.equipment.selections.map((selection) =>
            selection.entitlementId === STARTING_EQUIPMENT_ENTITLEMENT_ID &&
            selection.source.kind === 'class-instance'
              ? { ...selection, optionId: 'gold-alternative' }
              : selection,
          ),
        },
      },
    )

    expect(trySeedInventoryFromResolvedEquipment(diverged, again)).toBeNull()

    const playView = buildPlayResolvedEquipmentView(
      diverged,
      SRD_2024_EQUIPMENT_BY_ID,
      again.sources,
    )
    expect(playView.entries).toHaveLength(diverged.entries.length)
    expect(playView.currency.goldPieces).toBe(diverged.currency.goldPieces)
    expect(
      playView.entries.some((entry) => entry.itemId === 'srd-2024:torch'),
    ).toBe(true)
  })

  it('round-trips seeded inventory through .cforge export/import', async () => {
    const character = createFighterWithPackageA()
    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )
    const seeded = seedInventoryFromResolvedEntries(
      resolved.entries,
      resolved.currency.goldPieces,
    )
    const withInventory = {
      ...character,
      equipment: {
        ...character.equipment,
        inventory: seeded,
        loadout: {
          armorItemId: 'srd-2024:chain-mail',
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: 'two-handed' as const,
        },
      },
    }

    const imported = parseCharacterFile(serializeCharacterFile(withInventory))
    expect(imported).toEqual({ ok: true, character: withInventory })
    if (imported.ok) {
      expect(imported.character.equipment.inventory).toEqual(seeded)
      expect(imported.character.equipment.loadout.armorItemId).toBe(
        'srd-2024:chain-mail',
      )
    }
  })

  it('migrates v15 saves to v16 then leaves seed flag false until seed runs', () => {
    const result = migrateToCurrentSchema({
      schemaVersion: 15,
      character: {
        id: 'char-legacy',
        name: 'Legacy',
        editionId: 'srd-2024',
        creationMethod: 'manual',
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        species: null,
        targetLevel: 1,
        classes: [],
        startingClassInstanceId: null,
        background: null,
        feat: null,
        details: createDefaultCharacter().details,
        spellSourceStates: [],
        equipment: {
          selections: [],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.envelope.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.envelope.character.equipment.inventory).toEqual(
        EMPTY_CHARACTER_INVENTORY,
      )
    }
  })
})
