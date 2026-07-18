import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { resolveCharacterSpellcasting } from '../resolveCharacterSpellcasting'

describe('resolveCharacterSpellcasting (bundled ranger)', () => {
  it('exposes prepared selections and granted Hunter\'s Mark', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'ranger-1',
          classId: 'srd-2024:ranger',
          level: 1,
          choices: {
            'skill-proficiencies': ['athletics', 'perception', 'stealth'],
            'weapon-mastery': ['longbow', 'shortsword'],
          },
        },
      ],
    })

    const result = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      { spellCatalog: createBundledSpellCatalog() },
    )

    expect(result.hasSpellContent).toBe(true)
    expect(result.sharedSlots?.highestSlotLevel).toBe(1)

    const prepared = result.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    expect(prepared?.limit).toBe(2)

    const granted = result.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'favored-enemy',
    )
    expect(granted?.grantedSpells.map((spell) => spell.spellId)).toContain(
      'srd-2024:hunters-mark',
    )
  })
})
