// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyClassSelectionDrafts } from '../../features/class/classSelectionDraft'
import {
  clearClassEditorWorkflow,
  loadClassEditorWorkflow,
  saveClassEditorWorkflow,
} from './classEditorWorkflowStorage'

describe('classEditorWorkflowStorage', () => {
  beforeEach(() => {
    clearClassEditorWorkflow('char-test')
  })

  it('persists and restores class editor workflow state', () => {
    saveClassEditorWorkflow('char-test', {
      buildMode: 'multiclass',
      classDrafts: createEmptyClassSelectionDrafts(),
      selectedInstanceId: 'instance-1',
    })

    expect(loadClassEditorWorkflow('char-test')).toEqual({
      buildMode: 'multiclass',
      classDrafts: createEmptyClassSelectionDrafts(),
      selectedInstanceId: 'instance-1',
    })
  })

  it('returns null when no workflow state exists', () => {
    expect(loadClassEditorWorkflow('missing')).toBeNull()
  })
})
