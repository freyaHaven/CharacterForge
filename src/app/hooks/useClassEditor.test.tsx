/** @vitest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import {
  createTestFighterClassInstance,
  withSingleClassInstance,
} from '../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../domain/character/defaults'
import type { Character } from '../../domain/types'
import { useReviewClassDisplay } from '../useReviewClassDisplay'
import { useClassEditor } from './useClassEditor'

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
})
