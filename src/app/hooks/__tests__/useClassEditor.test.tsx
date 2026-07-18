/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { Character } from '../../../domain/types'
import { getEffectiveClassInstances } from '../../../features/class/classBuildMode'
import {
  clearClassEditorWorkflow,
} from '../../session/classEditorWorkflowStorage'
import { useReviewClassDisplay } from '../../useReviewClassDisplay'
import { useClassEditor } from '../useClassEditor'

const FIGHTER_ID = 'srd-2024:fighter'
const BARBARIAN_ID = 'srd-2024:barbarian'

function createCharacterWithCommittedFighter(): Character {
  return {
    ...createDefaultCharacter(),
    ...withSingleClassInstance(createTestFighterClassInstance()),
  }
}

function useClassEditorWithReview(character: Character) {
  const [currentCharacter, setCharacter] = useState(character)
  const classCatalog = createBundledClassCatalog()
  const classEditor = useClassEditor({
    character: currentCharacter,
    setCharacter,
    classCatalog,
  })
  const classReviewDisplay = useReviewClassDisplay(
    classCatalog,
    currentCharacter.editionId,
    currentCharacter.classes,
    classEditor.classDrafts,
    currentCharacter.targetLevel,
  )

  return { classEditor, classReviewDisplay }
}

function renderClassEditor(initialCharacter: Character = createDefaultCharacter()) {
  const catalog = createBundledClassCatalog()

  return renderHook(() => {
    const [character, setCharacter] = useState(initialCharacter)
    const editor = useClassEditor({
      character,
      setCharacter,
      classCatalog: catalog,
    })

    return { character, setCharacter, editor }
  })
}

describe('useClassEditor', () => {
  it('keeps committedSelection referentially stable across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useClassEditorWithReview(createCharacterWithCommittedFighter()),
    )

    const firstSelection = result.current.classEditor.committedSelection

    rerender()
    rerender()

    expect(result.current.classEditor.committedSelection).toBe(firstSelection)
  })

  it('does not re-run review display effects in a loop for a committed class', async () => {
    let renderCount = 0
    let getClassCalls = 0
    const baseCatalog = createBundledClassCatalog()
    const classCatalog = {
      listClasses: baseCatalog.listClasses,
      getClass: async (classId: string) => {
        getClassCalls += 1
        return baseCatalog.getClass(classId)
      },
    }

    renderHook(() => {
      renderCount += 1
      const [character, setCharacter] = useState(() =>
        createCharacterWithCommittedFighter(),
      )
      const classEditor = useClassEditor({
        character,
        setCharacter,
        classCatalog,
      })
      useReviewClassDisplay(
        classCatalog,
        character.editionId,
        character.classes,
        classEditor.classDrafts,
        character.targetLevel,
      )
    })

    await waitFor(() => {
      expect(getClassCalls).toBeGreaterThan(0)
    })

    const renderCountAfterSettle = renderCount
    const getClassCallsAfterSettle = getClassCalls

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(renderCount).toBeLessThanOrEqual(renderCountAfterSettle + 1)
    expect(getClassCalls).toBe(getClassCallsAfterSettle)
  })

  describe('single-class class switching', () => {
    beforeEach(() => {
      clearClassEditorWorkflow(createDefaultCharacter().id)
    })

    it('replaces a prior incomplete draft when selecting a different class', () => {
      const character = createDefaultCharacter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('single-class')
      })

      act(() => {
        result.current.editor.selectOrAddClass(FIGHTER_ID)
      })

      expect(
        Object.values(result.current.editor.classDrafts).map(
          (draft) => draft.classId,
        ),
      ).toEqual([FIGHTER_ID])

      act(() => {
        result.current.editor.selectOrAddClass(BARBARIAN_ID)
      })

      const draftClassIds = Object.values(result.current.editor.classDrafts).map(
        (draft) => draft.classId,
      )
      const effective = getEffectiveClassInstances(
        result.current.character.classes,
        result.current.editor.classDrafts,
      )

      expect(draftClassIds).toEqual([BARBARIAN_ID])
      expect(result.current.character.classes).toEqual([])
      expect(effective).toHaveLength(1)
      expect(effective[0]?.classId).toBe(BARBARIAN_ID)
    })

    it('preserves a committed class when browsing a different class draft', () => {
      const character = createCharacterWithCommittedFighter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('single-class')
      })

      const committedBefore = result.current.character.classes
      const startingBefore = result.current.character.startingClassInstanceId
      const targetBefore = result.current.character.targetLevel

      act(() => {
        result.current.editor.selectOrAddClass(BARBARIAN_ID)
      })

      expect(result.current.character.classes).toEqual(committedBefore)
      expect(result.current.character.startingClassInstanceId).toBe(startingBefore)
      expect(result.current.character.targetLevel).toBe(targetBefore)
      expect(Object.keys(result.current.editor.classDrafts)).toHaveLength(1)
      expect(
        Object.values(result.current.editor.classDrafts)[0]?.classId,
      ).toBe(BARBARIAN_ID)
      expect(
        Object.values(result.current.editor.classDrafts).some(
          (draft) => draft.classId === FIGHTER_ID,
        ),
      ).toBe(false)
    })

    it('clears all drafts when committing a single-class instance', () => {
      const character = createDefaultCharacter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('single-class')
      })

      act(() => {
        result.current.editor.selectOrAddClass(FIGHTER_ID)
      })

      const fighterDraft = Object.values(result.current.editor.classDrafts)[0]
      expect(fighterDraft).toBeDefined()

      act(() => {
        result.current.editor.selectOrAddClass(BARBARIAN_ID)
      })

      const barbarianDraft = Object.values(result.current.editor.classDrafts)[0]
      expect(barbarianDraft?.classId).toBe(BARBARIAN_ID)

      act(() => {
        result.current.editor.commitClassInstance({
          instanceId: barbarianDraft!.instanceId,
          classId: BARBARIAN_ID,
          level: 1,
          choices: {},
        })
      })

      expect(result.current.editor.classDrafts).toEqual({})
      expect(result.current.character.classes).toHaveLength(1)
      expect(result.current.character.classes[0]?.classId).toBe(BARBARIAN_ID)
    })

    it('atomically replaces the committed class on successful single-class commit', () => {
      const character = createCharacterWithCommittedFighter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('single-class')
      })

      act(() => {
        result.current.editor.selectOrAddClass(BARBARIAN_ID)
      })

      const barbarianDraft = Object.values(result.current.editor.classDrafts)[0]
      expect(barbarianDraft).toBeDefined()

      act(() => {
        result.current.editor.commitClassInstance({
          instanceId: barbarianDraft!.instanceId,
          classId: BARBARIAN_ID,
          level: 3,
          choices: {},
        })
      })

      expect(result.current.character.classes).toHaveLength(1)
      expect(result.current.character.classes[0]?.classId).toBe(BARBARIAN_ID)
      expect(result.current.character.classes[0]?.level).toBe(3)
      expect(result.current.character.startingClassInstanceId).toBe(
        barbarianDraft!.instanceId,
      )
      expect(result.current.character.targetLevel).toBe(3)
      expect(result.current.editor.classDrafts).toEqual({})
    })

    it('clears a replacement draft when returning to the committed class', () => {
      const character = createCharacterWithCommittedFighter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('single-class')
      })

      act(() => {
        result.current.editor.selectOrAddClass(BARBARIAN_ID)
      })

      expect(Object.keys(result.current.editor.classDrafts)).toHaveLength(1)

      act(() => {
        result.current.editor.selectOrAddClass(FIGHTER_ID)
      })

      expect(result.current.editor.classDrafts).toEqual({})
      expect(result.current.character.classes[0]?.classId).toBe(FIGHTER_ID)
      expect(result.current.editor.activeInstanceId).toBe(
        character.classes[0]?.instanceId,
      )
    })
  })

  describe('multiclass class switching', () => {
    beforeEach(() => {
      clearClassEditorWorkflow(createDefaultCharacter().id)
    })

    it('keeps both classes when adding a second class', () => {
      const character = createDefaultCharacter()
      clearClassEditorWorkflow(character.id)
      const { result } = renderClassEditor(character)

      act(() => {
        result.current.editor.hydrateForCharacter(character)
        result.current.editor.setBuildMode('multiclass')
      })

      act(() => {
        result.current.editor.toggleMulticlassClass(FIGHTER_ID)
        result.current.editor.toggleMulticlassClass(BARBARIAN_ID)
      })

      const effective = getEffectiveClassInstances(
        result.current.character.classes,
        result.current.editor.classDrafts,
      )
      const classIds = effective.map((instance) => instance.classId).sort()

      expect(effective).toHaveLength(2)
      expect(classIds).toEqual([BARBARIAN_ID, FIGHTER_ID].sort())
    })
  })
})
