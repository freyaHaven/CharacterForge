import type { ClassBuildMode } from '../../features/class/classBuildMode'
import type { ClassSelectionDrafts } from '../../features/class/classSelectionDraft'
import { createEmptyClassSelectionDrafts } from '../../features/class/classSelectionDraft'

export type ClassEditorWorkflowState = {
  buildMode: ClassBuildMode | null
  classDrafts: ClassSelectionDrafts
  selectedInstanceId: string | null
}

function storageKey(characterId: string): string {
  return `characterforge:class-editor-workflow:${characterId}`
}

export function loadClassEditorWorkflow(
  characterId: string,
): ClassEditorWorkflowState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(storageKey(characterId))

  if (raw === null) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ClassEditorWorkflowState>

    return {
      buildMode:
        parsed.buildMode === 'single-class' || parsed.buildMode === 'multiclass'
          ? parsed.buildMode
          : null,
      classDrafts: parsed.classDrafts ?? createEmptyClassSelectionDrafts(),
      selectedInstanceId:
        typeof parsed.selectedInstanceId === 'string'
          ? parsed.selectedInstanceId
          : null,
    }
  } catch {
    return null
  }
}

export function saveClassEditorWorkflow(
  characterId: string,
  state: ClassEditorWorkflowState,
): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(storageKey(characterId), JSON.stringify(state))
}

export function clearClassEditorWorkflow(characterId: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.removeItem(storageKey(characterId))
}
