/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createBundledEquipmentCatalog } from '../../../adapters/bundledEquipmentCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { parseCharacterFile } from '../../../adapters/characterFile'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../../domain/equipment/startingEquipmentHelpers'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import type { Character } from '../../../domain/types'
import type { CharacterRepository } from '../../../domain/ports/characterRepository'
import { createEmptyClassSelectionDrafts } from '../../../features/class/classSelectionDraft'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import { COMPLETE_DWARF_SELECTION } from '../../../testing/speciesSelectionTestUtils'
import {
  clearClassEditorWorkflow,
  saveClassEditorWorkflow,
} from '../../session/classEditorWorkflowStorage'
import {
  clearEditorSession,
  getActiveCharacterId,
} from '../../session/editorSession'
import { getCharacterOpenDestination } from '../../wizard/resolveCharacterStepLanding'
import { useCharacterEditor } from '../useCharacterEditor'

const speciesCatalog = createBundledSpeciesCatalog()
const classCatalog = createBundledClassCatalog()
const backgroundCatalog = createBundledBackgroundCatalog()
const featCatalog = createBundledFeatCatalog()
const spellCatalog = createBundledSpellCatalog()
const equipmentCatalog = createBundledEquipmentCatalog()

const catalogs = {
  speciesCatalog,
  classCatalog,
  backgroundCatalog,
  featCatalog,
  spellCatalog,
  equipmentCatalog,
}

function createCompleteSoldierBackground(): NonNullable<Character['background']> {
  return {
    backgroundId: 'srd-2024:soldier',
    abilityScoreIncrease: {
      mode: 'two-and-one',
      plusTwo: 'strength',
      plusOne: 'constitution',
    },
    choices: {
      'gaming-set': 'dice-set',
    },
  }
}

function createCompleteStartingEquipment(
  classInstanceId: string,
  backgroundId: string,
  classOptionId = 'package-a',
): Character['equipment'] {
  return {
    selections: [
      {
        source: { kind: 'class-instance', instanceId: classInstanceId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: classOptionId,
        choices: [],
      },
      {
        source: { kind: 'background', backgroundId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: PACKAGE_OPTION_ID,
        choices: [],
      },
    ],
    loadout: EMPTY_EQUIPMENT_LOADOUT,
  }
}

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter({
    id: 'char-open-1',
    name: 'Freya',
    species: { ...COMPLETE_DWARF_SELECTION },
    ...overrides,
  })
}

function createCompleteSavedCharacter(
  overrides: Partial<Character> = {},
): Character {
  const fighter = createTestFighterClassInstance()

  return createStoredCharacter({
    ...withSingleClassInstance(fighter),
    background: createCompleteSoldierBackground(),
    equipment: createCompleteStartingEquipment(
      fighter.instanceId,
      'srd-2024:soldier',
    ),
    ...overrides,
  })
}

function createCompleteClericCharacter(
  overrides: Partial<Character> = {},
): Character {
  const clericInstanceId = 'cleric-instance-1'

  return createStoredCharacter({
    id: 'char-open-cleric',
    name: 'Cleric Hero',
    ...withSingleClassInstance({
      instanceId: clericInstanceId,
      classId: 'srd-2024:cleric',
      level: 1,
      choices: {
        'skill-proficiencies': ['insight', 'religion'],
        'divine-order': 'protector',
      },
    }),
    background: createCompleteSoldierBackground(),
    spellSourceStates: [],
    equipment: createCompleteStartingEquipment(
      clericInstanceId,
      'srd-2024:soldier',
      PACKAGE_OPTION_ID,
    ),
    ...overrides,
  })
}

async function renderEditor(repository: CharacterRepository) {
  const hook = renderHook(() =>
    useCharacterEditor({
      repository,
      speciesCatalog,
      classCatalog,
      backgroundCatalog,
      featCatalog,
      spellCatalog,
      restoreFromStorage: false,
    }),
  )

  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false)
  })

  return hook
}

describe('useCharacterEditor.openCharacter', () => {
  beforeEach(() => {
    clearEditorSession()
    clearClassEditorWorkflow('char-open-1')
    clearClassEditorWorkflow('char-open-cleric')
  })

  it('loads a character, hydrates class workflow, and opens the first incomplete step', async () => {
    const character = createStoredCharacter()
    const load = vi.fn().mockResolvedValue(character)
    const save = vi.fn().mockResolvedValue(undefined)
    const repository: CharacterRepository = { load, save, remove: vi.fn() }

    saveClassEditorWorkflow(character.id, {
      buildMode: 'single-class',
      classDrafts: createEmptyClassSelectionDrafts(),
      selectedInstanceId: null,
    })

    const { result } = await renderEditor(repository)

    let opened = false
    await act(async () => {
      opened = await result.current.openCharacter(character.id)
    })

    expect(opened).toBe(true)
    expect(load).toHaveBeenCalledWith(character.id)
    expect(result.current.character.name).toBe('Freya')
    expect(result.current.character.id).toBe(character.id)
    expect(result.current.activeStepId).toBe('class')
    expect(result.current.classEditor.buildMode).toBe('single-class')
    expect(getActiveCharacterId()).toBe(character.id)
  })

  it('opens Overview for a complete saved character', async () => {
    const character = createCompleteSavedCharacter()
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })

    expect(result.current.activeStepId).toBe('review')
  })

  it('opens the first incomplete step for an incomplete saved character', async () => {
    const character = createCompleteSavedCharacter({ species: null })
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })

    expect(result.current.activeStepId).toBe('species')
  })

  it('does not reopen on a later step when an earlier step is incomplete', async () => {
    const character = createCompleteSavedCharacter({ name: '' })
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })

    expect(result.current.activeStepId).toBe('basics')
  })

  it('opens Overview for a non-spellcaster with all applicable steps complete', async () => {
    const character = createCompleteSavedCharacter({ spellSourceStates: [] })
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })

    expect(result.current.activeStepId).toBe('review')
  })

  it('opens Spells for a spellcaster with incomplete spell choices', async () => {
    const character = createCompleteClericCharacter()
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })

    expect(result.current.activeStepId).toBe('spells')
  })

  it('routes a migrated saved character using the migrated data', async () => {
    const fighter = createTestFighterClassInstance()
    const parsed = parseCharacterFile(
      JSON.stringify({
        schemaVersion: 7,
        character: {
          id: 'char-open-1',
          name: 'Legacy Saved',
          editionId: 'srd-2024',
          creationMethod: 'manual',
          abilityScores: {
            strength: 15,
            dexterity: 14,
            constitution: 13,
            intelligence: 12,
            wisdom: 10,
            charisma: 8,
          },
          species: { ...COMPLETE_DWARF_SELECTION },
          class: {
            classId: fighter.classId,
            level: fighter.level,
            choices: fighter.choices,
          },
          background: null,
          feat: null,
          details: {
            age: '',
            gender: '',
            pronouns: '',
            alignment: null,
            height: '',
            weight: '',
            eyes: 'brown',
            hair: 'black',
            skin: 'fair',
            appearance: '',
            notes: 'old notes',
          },
        },
      }),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(parsed.character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(parsed.character.id)
    })

    expect(result.current.activeStepId).toBe('background')
    expect(result.current.character.classes).toHaveLength(1)
  })

  it('uses the same destination helper as import for the same character', async () => {
    const character = createCompleteSavedCharacter({ species: null })
    const expected = await getCharacterOpenDestination(character, catalogs)

    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(character),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.openCharacter(character.id)
    })
    expect(result.current.activeStepId).toBe(expected)

    await act(async () => {
      await result.current.importCharacter({
        ...character,
        id: 'char-imported-same',
      })
    })
    expect(result.current.activeStepId).toBe(expected)
  })

  it('starts a brand-new character on Basics', async () => {
    const repository: CharacterRepository = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    }

    const { result } = await renderEditor(repository)

    await act(async () => {
      await result.current.startNewCharacter()
    })

    expect(result.current.activeStepId).toBe('basics')
    expect(result.current.character.name).toBe('')
  })

  it('returns false when the character is missing', async () => {
    const load = vi.fn().mockResolvedValue(null)
    const save = vi.fn().mockResolvedValue(undefined)
    const repository: CharacterRepository = { load, save, remove: vi.fn() }

    const { result } = await renderEditor(repository)

    let opened = true
    await act(async () => {
      opened = await result.current.openCharacter('missing-id')
    })

    expect(opened).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})
