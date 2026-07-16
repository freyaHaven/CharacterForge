// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { Character } from '../../../domain/types'
import {
  clearClassEditorWorkflow,
  loadClassEditorWorkflow,
} from '../../session/classEditorWorkflowStorage'
import { useClassEditor } from '../useClassEditor'

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

describe('useClassEditor workflow persistence', () => {
  beforeEach(() => {
    clearClassEditorWorkflow(createDefaultCharacter().id)
  })

  it('persists the selected class path across remount', async () => {
    const character = createDefaultCharacter()
    clearClassEditorWorkflow(character.id)

    const first = renderClassEditor(character)

    act(() => {
      first.result.current.editor.hydrateForCharacter(character)
      first.result.current.editor.setBuildMode('multiclass')
    })

    await waitFor(() => {
      expect(loadClassEditorWorkflow(character.id)?.buildMode).toBe('multiclass')
    })

    first.unmount()

    const second = renderClassEditor(character)

    act(() => {
      second.result.current.editor.hydrateForCharacter(character)
    })

    expect(second.result.current.editor.buildMode).toBe('multiclass')
  })
})
