import { describe, expect, it } from 'vitest'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { clericSrd2024 } from '../../../content/packs/srd-2024/classes/cleric'
import { wizardSrd2024 } from '../../../content/packs/srd-2024/classes/wizard'
import type { ClassDefinition } from '../../../domain/class/types'
import {
  countUnlockLevel,
  resolveCharacterSpellcasting,
  resolveEntitlementSlotCeiling,
} from '../../character/resolveCharacterSpellcasting'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../domain/spell/progressions'

const spellCatalog = createBundledSpellCatalog()

function createCatalog(definitions: Record<string, ClassDefinition | null>) {
  return {
    listClasses: async () =>
      Object.values(definitions).filter(
        (definition): definition is ClassDefinition => definition !== null,
      ),
    getClass: async (classId: string) => definitions[classId] ?? null,
  }
}

describe('Wizard spellbook accessible levels', () => {
  it('derives count-unlock levels for level-gated additions', () => {
    const spellbook3 = wizardSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'spellbook-3',
    )
    expect(spellbook3?.kind).toBe('select')
    if (spellbook3?.kind !== 'select') {
      return
    }
    expect(countUnlockLevel(spellbook3.count)).toBe(3)
    expect(
      resolveEntitlementSlotCeiling({
        entitlement: spellbook3,
        sourceLevel: 10,
        classSlotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
        sharedSlotCeiling: 5,
      }),
    ).toBe(2)
  })

  it('limits each spellbook addition to the grant-level slot ceiling', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 5,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const group = summary.groups[0]
    const byId = new Map(
      group?.entitlements.map((entry) => [entry.entitlementId, entry]),
    )

    expect(byId.get('spellbook-1')?.accessibleLevels).toEqual([1])
    expect(byId.get('spellbook-2')?.accessibleLevels).toEqual([1])
    expect(byId.get('spellbook-3')?.accessibleLevels).toEqual([1, 2])
    expect(byId.get('spellbook-4')?.accessibleLevels).toEqual([1, 2])
    expect(byId.get('spellbook-5')?.accessibleLevels).toEqual([1, 2, 3])
    expect(byId.get('prepared')?.accessibleLevels).toEqual([1, 2, 3])
  })

  it('does not let multiclass shared slots unlock higher Wizard spell levels', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 5,
          choices: {},
        },
        {
          instanceId: 'clr-1',
          classId: clericSrd2024.id,
          level: 5,
          choices: {},
        },
      ],
      startingClassInstanceId: 'wiz-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({
        [wizardSrd2024.id]: wizardSrd2024,
        [clericSrd2024.id]: clericSrd2024,
      }),
      character,
      { spellCatalog },
    )

    expect(summary.sharedSlots?.highestSlotLevel).toBeGreaterThan(3)

    const wizardGroup = summary.groups.find((group) =>
      group.groupId.includes('wiz-1'),
    )
    const prepared = wizardGroup?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    const spellbook5 = wizardGroup?.entitlements.find(
      (entry) => entry.entitlementId === 'spellbook-5',
    )

    expect(prepared?.accessibleLevels).toEqual([1, 2, 3])
    expect(spellbook5?.accessibleLevels).toEqual([1, 2, 3])
    expect(prepared?.accessibleLevels.includes(5)).toBe(false)
  })
})
