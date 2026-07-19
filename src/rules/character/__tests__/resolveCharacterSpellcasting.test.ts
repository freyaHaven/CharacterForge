import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { createTestClassSpellcasting } from '../../../testing/createTestClassSpellcasting'
import { resolveCharacterSpellcasting } from '../resolveCharacterSpellcasting'

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

    expect(result.hasSpellcastingCapability).toBe(false)
    expect(result.hasSpellContent).toBe(false)
    expect(result.spellLines).toEqual([])
    expect(result.groups).toEqual([])
  })

  it('detects spellcasting from class spellcasting entitlements', async () => {
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
          spellcasting: createTestClassSpellcasting({
            ability: 'intelligence',
            entitlements: [
              {
                id: 'prepared',
                kind: 'select',
                listId: 'test:list',
                selectionKind: 'prepared',
                count: { kind: 'fixed', value: 2 },
                levelRange: { min: 1, max: 'slot-ceiling' },
              },
            ],
          }),
        },
      }),
      character,
    )

    expect(result.hasSpellcastingCapability).toBe(true)
    expect(result.hasSpellContent).toBe(true)
    expect(result.groups).toHaveLength(1)
  })

  it('labels background-origin spellcasting as granted by background', async () => {
    const character = createDefaultCharacter({
      background: {
        backgroundId: 'srd-2024:acolyte',
        abilityScoreBonuses: {
          abilityScoreIncreases: {},
        },
        choices: {},
      },
    })

    const result = await resolveCharacterSpellcasting(
      createCatalog({}),
      character,
      {
        backgroundCatalog: {
          listBackgrounds: async () => [],
          getBackground: async () => ({
            id: 'srd-2024:acolyte',
            editionId: 'srd-2024',
            name: 'Acolyte',
            description: 'Test',
            source: {
              id: 'test',
              name: 'Test',
              version: '1',
              licence: 'CC-BY-4.0',
              attribution: 'Test',
              documentUrl: 'https://example.test',
            },
            eligibleAbilityScores: ['wisdom'],
            originFeat: {
              id: 'magic-initiate-cleric',
              featId: 'srd-2024:magic-initiate-cleric',
              name: 'Magic Initiate (Cleric)',
              description: 'Test',
            },
            skillProficiencies: [],
            toolProficiency: {
              kind: 'fixed',
              toolId: 'calligraphers-supplies',
              label: "Calligrapher's Supplies",
            },
            equipment: {
              id: 'equipment',
              prompt: 'Equipment',
              options: [],
            },
            choices: [],
          }),
        },
        featCatalog: {
          listFeats: async () => [],
          getFeat: async () => ({
            id: 'srd-2024:magic-initiate-cleric',
            editionId: 'srd-2024',
            name: 'Magic Initiate (Cleric)',
            summary: 'Test',
            description: 'Test',
            source: {
              id: 'test',
              name: 'Test',
              version: '1',
              licence: 'CC-BY-4.0',
              attribution: 'Test',
              documentUrl: 'https://example.test',
            },
            category: 'origin',
            prerequisite: { kind: 'none' },
            benefits: [],
            repeatable: false,
            choices: [],
            spellcasting: {
              ability: 'wisdom',
              spellListId: 'srd-2024:spell-list:cleric',
              entitlements: [
                {
                  id: 'mi-cantrips',
                  kind: 'select',
                  listId: 'srd-2024:spell-list:cleric',
                  selectionKind: 'cantrip',
                  count: { kind: 'fixed', value: 2 },
                  levelRange: { min: 0, max: 0 },
                },
              ],
            },
          }),
        },
      },
    )

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]?.label).toBe(
      'Acolyte: Magic Initiate (Granted by Background)',
    )
  })

  it('labels character-feat spellcasting as granted by feat', async () => {
    const character = createDefaultCharacter({
      feat: {
        featId: 'srd-2024:magic-initiate-cleric',
        choices: {},
      },
    })

    const result = await resolveCharacterSpellcasting(
      createCatalog({}),
      character,
      {
        featCatalog: {
          listFeats: async () => [],
          getFeat: async () => ({
            id: 'srd-2024:magic-initiate-cleric',
            editionId: 'srd-2024' as const,
            name: 'Magic Initiate (Cleric)',
            summary: 'Test',
            description: 'Test',
            source: {
              id: 'test',
              name: 'Test',
              version: '1',
              licence: 'CC-BY-4.0',
              attribution: 'Test',
              documentUrl: 'https://example.test',
            },
            category: 'origin' as const,
            prerequisite: { kind: 'none' as const },
            benefits: [],
            repeatable: false,
            choices: [],
            spellcasting: {
              ability: 'wisdom' as const,
              spellListId: 'srd-2024:spell-list:cleric',
              entitlements: [
                {
                  id: 'mi-cantrips',
                  kind: 'select' as const,
                  listId: 'srd-2024:spell-list:cleric',
                  selectionKind: 'cantrip' as const,
                  count: { kind: 'fixed' as const, value: 2 },
                  levelRange: { min: 0, max: 0 },
                },
              ],
            },
          }),
        },
      },
    )

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]?.label).toBe('Magic Initiate (Granted by Feat)')
  })
})
