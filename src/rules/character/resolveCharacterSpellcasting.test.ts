import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../content/packs/srd-2024/classes/fighter'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { resolveCharacterSpellcasting } from './resolveCharacterSpellcasting'

function createCatalog(definitions: Record<string, typeof fighterSrd2024 | null>) {
  return {
    listClasses: async () =>
      Object.values(definitions).filter(
        (definition): definition is typeof fighterSrd2024 => definition !== null,
      ),
    getClass: async (classId: string) => definitions[classId] ?? null,
  }
}

describe('resolveCharacterSpellcasting', () => {
  it('returns false when no class instances grant spellcasting', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ],
    })

    const result = await resolveCharacterSpellcasting(
      createCatalog({
        'srd-2024:fighter': fighterSrd2024,
      }),
      character,
    )

    expect(result).toEqual({
      hasSpellcastingCapability: false,
      spellLines: [],
    })
  })

  it('detects spellcasting from resolved class effects rather than class name', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 1,
          choices: {},
        },
      ],
    })

    const result = await resolveCharacterSpellcasting(
      createCatalog({
        'srd-2024:wizard': {
          ...fighterSrd2024,
          id: 'srd-2024:wizard',
          name: 'Wizard',
          spellcasting: { ability: 'intelligence' },
        },
      }),
      character,
    )

    expect(result.hasSpellcastingCapability).toBe(true)
  })
})
