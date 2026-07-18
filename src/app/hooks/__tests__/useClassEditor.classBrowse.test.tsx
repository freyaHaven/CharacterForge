/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { getClassInstancesForHitPoints } from '../../../domain/character/classLevels'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { Character } from '../../../domain/types'
import { resolveHitPointMaximum } from '../../../rules/hit-points/resolveHitPointMaximum'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { rogueSrd2024 } from '../../../content/packs/srd-2024/classes/rogue'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import { tryCommitClassInstanceDraft } from '../../../features/class/classSelectionDraft'
import {
  clearClassEditorWorkflow,
  loadClassEditorWorkflow,
} from '../../session/classEditorWorkflowStorage'
import { useReviewClassDisplay } from '../../useReviewClassDisplay'
import { useClassEditor } from '../useClassEditor'
import { resolveCharacterContextDisplay } from '../../../features/character/resolveCharacterContextDisplay'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'

const FIGHTER_ID = 'srd-2024:fighter'
const ROGUE_ID = 'srd-2024:rogue'

const classDefinitionsById = new Map([
  [fighterSrd2024.id, fighterSrd2024],
  [rogueSrd2024.id, rogueSrd2024],
])

function createCommittedFighter(level: number, constitution: number): Character {
  const fighter = createTestFighterClassInstance({ level })
  return {
    ...createDefaultCharacter({
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    }),
    ...withSingleClassInstance(fighter),
    targetLevel: level as Character['targetLevel'],
  }
}

function createCommittedRogue(): Character {
  return {
    ...createDefaultCharacter(),
    ...withSingleClassInstance({
      instanceId: 'rogue-instance-1',
      classId: ROGUE_ID,
      level: 1,
      choices: {
        'skill-proficiencies': ['stealth', 'sleight-of-hand', 'acrobatics', 'investigation'],
      },
      hitPointIncreases: [{ classLevel: 1, method: 'max' }],
    }),
    targetLevel: 1,
  }
}

function renderClassEditor(initialCharacter: Character) {
  const catalog = createBundledClassCatalog()

  return renderHook(() => {
    const [character, setCharacter] = useState(initialCharacter)
    const editor = useClassEditor({
      character,
      setCharacter,
      classCatalog: catalog,
    })
    const classReviewDisplay = useReviewClassDisplay(
      catalog,
      character.editionId,
      character.classes,
      editor.classDrafts,
      character.targetLevel,
    )

    return { character, setCharacter, editor, classReviewDisplay }
  })
}

function resolveOverviewHp(character: Character, classDrafts: Record<string, { instanceId: string; classId: string; level: number; choices: Record<string, unknown>; hitPointIncreases?: { classLevel: number; method: 'max' | 'fixed' | 'roll'; rolledValue?: number }[] }>) {
  const classes = getClassInstancesForHitPoints(
    character.classes,
    classDrafts as never,
  )
  return resolveHitPointMaximum({
    classes,
    startingClassInstanceId: character.startingClassInstanceId,
    classDefinitionsById,
    abilityScores: character.abilityScores,
    speciesDefinition: null,
    speciesSelection: null,
  })
}

describe('useClassEditor single-class browse preserves committed state', () => {
  beforeEach(() => {
    clearClassEditorWorkflow(createDefaultCharacter().id)
  })

  const constitutionCases = [-1, 0, 2] as const
  const levelCases = [1, 5] as const

  for (const level of levelCases) {
    for (const conMod of constitutionCases) {
      const constitution = 10 + conMod * 2

      it(`keeps Fighter L${level} HP with CON ${conMod >= 0 ? '+' : ''}${conMod} while browsing incomplete Rogue`, () => {
        const character = createCommittedFighter(level, constitution)
        clearClassEditorWorkflow(character.id)
        const { result } = renderClassEditor(character)

        act(() => {
          result.current.editor.hydrateForCharacter(character)
          result.current.editor.setBuildMode('single-class')
        })

        const hpBefore = resolveOverviewHp(
          result.current.character,
          result.current.editor.classDrafts,
        )

        act(() => {
          result.current.editor.selectOrAddClass(ROGUE_ID)
        })

        const hpAfter = resolveOverviewHp(
          result.current.character,
          result.current.editor.classDrafts,
        )

        expect(result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
        expect(result.current.character.classes[0]?.level).toBe(level)
        expect(result.current.character.startingClassInstanceId).toBe(
          character.startingClassInstanceId,
        )
        expect(result.current.character.targetLevel).toBe(level)
        expect(Object.values(result.current.editor.classDrafts)[0]?.classId).toBe(
          ROGUE_ID,
        )
        expect(hpAfter.maximum).toBe(hpBefore.maximum)
        expect(hpAfter.isComplete).toBe(true)
      })
    }
  }

  it('keeps Rogue committed while browsing incomplete Fighter', () => {
    const character = createCommittedRogue()
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    const hpBefore = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )

    act(() => {
      result.current.editor.selectOrAddClass(FIGHTER_ID)
    })

    const hpAfter = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )

    expect(result.current.character.classes[0]?.classId).toBe(ROGUE_ID)
    expect(result.current.character.targetLevel).toBe(1)
    expect(Object.values(result.current.editor.classDrafts)[0]?.classId).toBe(
      FIGHTER_ID,
    )
    expect(hpAfter.maximum).toBe(hpBefore.maximum)
  })

  it('restores committed Fighter after browse then cancel by returning to Fighter', () => {
    const character = createCommittedFighter(5, 14)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    act(() => {
      result.current.editor.selectOrAddClass(FIGHTER_ID)
    })

    expect(result.current.editor.classDrafts).toEqual({})
    expect(result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
    expect(result.current.character.targetLevel).toBe(5)
    expect(result.current.character.startingClassInstanceId).toBe(
      character.startingClassInstanceId,
    )
  })

  it('preserves committed Fighter when navigating away with an incomplete Rogue draft', () => {
    const character = createCommittedFighter(5, 12)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    // Simulate leaving the class step without committing: drafts remain, character does not.
    expect(result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
    expect(result.current.character.targetLevel).toBe(5)
    expect(Object.keys(result.current.editor.classDrafts)).toHaveLength(1)
  })

  it('reloads an incomplete replacement draft without erasing the committed class', async () => {
    const character = createCommittedFighter(5, 10)
    clearClassEditorWorkflow(character.id)

    const first = renderClassEditor(character)

    act(() => {
      first.result.current.editor.hydrateForCharacter(character)
      first.result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      first.result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    await waitFor(() => {
      expect(loadClassEditorWorkflow(character.id)?.buildMode).toBe('single-class')
    })

    const workflow = loadClassEditorWorkflow(character.id)
    expect(Object.values(workflow?.classDrafts ?? {})[0]?.classId).toBe(ROGUE_ID)
    expect(first.result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)

    first.unmount()

    const second = renderClassEditor({
      ...character,
      classes: first.result.current.character.classes,
      startingClassInstanceId:
        first.result.current.character.startingClassInstanceId,
      targetLevel: first.result.current.character.targetLevel,
    })

    act(() => {
      second.result.current.editor.hydrateForCharacter(
        second.result.current.character,
      )
    })

    expect(second.result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
    expect(second.result.current.character.targetLevel).toBe(5)
    expect(
      Object.values(second.result.current.editor.classDrafts)[0]?.classId,
    ).toBe(ROGUE_ID)
    expect(second.result.current.editor.buildMode).toBe('single-class')
  })

  it('replaces the committed class only after a successful confirm', () => {
    const character = createCommittedFighter(5, 14)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    const rogueDraft = Object.values(result.current.editor.classDrafts)[0]!

    act(() => {
      result.current.editor.commitClassInstance({
        instanceId: rogueDraft.instanceId,
        classId: ROGUE_ID,
        level: 1,
        choices: {
          'skill-proficiencies': [
            'stealth',
            'sleight-of-hand',
            'acrobatics',
            'investigation',
          ],
        },
        hitPointIncreases: [{ classLevel: 1, method: 'max' }],
      })
    })

    expect(result.current.character.classes).toHaveLength(1)
    expect(result.current.character.classes[0]?.classId).toBe(ROGUE_ID)
    expect(result.current.character.startingClassInstanceId).toBe(
      rogueDraft.instanceId,
    )
    expect(result.current.character.targetLevel).toBe(1)
    expect(result.current.editor.classDrafts).toEqual({})

    const hp = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )
    // Rogue d8 max + CON(+2) = 10
    expect(hp.maximum).toBe(10)
  })

  it('leaves the committed class untouched when draft validation fails', async () => {
    const character = createCommittedFighter(5, 10)
    clearClassEditorWorkflow(character.id)
    const catalog = createBundledClassCatalog()
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    const rogueDraft = Object.values(result.current.editor.classDrafts)[0]!
    const definition = await catalog.getClass(ROGUE_ID)
    const { committed } = tryCommitClassInstanceDraft(
      rogueDraft,
      character.editionId,
      definition,
      { isStartingClass: true },
    )

    expect(committed).toBeNull()
    expect(result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
    expect(result.current.character.targetLevel).toBe(5)
    expect(result.current.character.startingClassInstanceId).toBe(
      character.startingClassInstanceId,
    )
  })

  it('does not let a multiclass uncommitted draft affect HP', () => {
    const character = createCommittedFighter(3, 14)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('multiclass')
    })

    const hpBefore = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    const hpAfter = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )

    expect(Object.values(result.current.editor.classDrafts).some(
      (draft) => draft.classId === ROGUE_ID,
    )).toBe(true)
    expect(hpAfter.maximum).toBe(hpBefore.maximum)
  })

  it('previews same-class draft level and HP-method edits against the committed instance', () => {
    const character = createCommittedFighter(1, 10)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)
    const fighterId = character.classes[0]!.instanceId

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.setClassDraft({
        classId: FIGHTER_ID,
        level: 3,
        choices: character.classes[0]!.choices,
        hitPointIncreases: [
          { classLevel: 1, method: 'max' },
          { classLevel: 2, method: 'fixed' },
          { classLevel: 3, method: 'roll', rolledValue: 9 },
        ],
      })
    })

    expect(result.current.editor.classDrafts[fighterId]?.level).toBe(3)

    const hp = resolveOverviewHp(
      result.current.character,
      result.current.editor.classDrafts,
    )
    // L1: 10+0, L2: 6+0, L3: 9+0 = 25
    expect(hp.maximum).toBe(25)
    expect(result.current.character.classes[0]?.level).toBe(1)
  })

  it('keeps Review and Character Context on committed data while browsing', async () => {
    const character = createCommittedFighter(5, 14)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)
    const speciesCatalog = createBundledSpeciesCatalog()
    const classCatalog = createBundledClassCatalog()

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    await waitFor(() => {
      expect(result.current.classReviewDisplay.className).toBe('Fighter')
    })

    expect(result.current.classReviewDisplay.level).toBe(5)
    expect(result.current.classReviewDisplay.className).not.toBe('Rogue')

    const context = await resolveCharacterContextDisplay({
      character: result.current.character,
      activeStepId: 'background',
      speciesDraft: null,
      classDrafts: result.current.editor.classDrafts,
      speciesCatalog,
      classCatalog,
    })

    expect(context.buildLine).toBe('Fighter 5')
    expect(context.buildLine).not.toContain('Rogue')
  })

  it('does not reset target level or starting class merely by browsing', () => {
    const character = createCommittedFighter(5, 10)
    clearClassEditorWorkflow(character.id)
    const { result } = renderClassEditor(character)

    act(() => {
      result.current.editor.hydrateForCharacter(character)
      result.current.editor.setBuildMode('single-class')
    })

    act(() => {
      result.current.editor.selectOrAddClass(ROGUE_ID)
    })

    expect(result.current.character.targetLevel).toBe(5)
    expect(result.current.character.startingClassInstanceId).toBe(
      character.startingClassInstanceId,
    )
    expect(result.current.character.classes).toEqual(character.classes)
  })
})
