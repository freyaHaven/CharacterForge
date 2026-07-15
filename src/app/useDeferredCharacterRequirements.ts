import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type {
  Character,
  ResolvedDeferredCharacterRequirement,
} from '../domain/types'
import type { ClassSelectionDraft } from '../features/class/classSelectionDraft'
import { instanceDraftToClassInstance } from '../features/class/classSelectionDraft'
import {
  getEffectiveClassesForDeferredRequirements,
  resolveDeferredRequirementsForCharacter,
} from '../rules/class/resolveCharacterDeferredRequirements'

export function useDeferredCharacterRequirements(
  catalog: ClassCatalog,
  character: Character,
  classDraft: ClassSelectionDraft | null,
  activeInstanceId: string | null,
): ResolvedDeferredCharacterRequirement[] {
  const [requirements, setRequirements] = useState<
    ResolvedDeferredCharacterRequirement[]
  >([])

  useEffect(() => {
    const draftInstance =
      classDraft !== null && activeInstanceId !== null
        ? instanceDraftToClassInstance({
            instanceId: activeInstanceId,
            classId: classDraft.classId,
            level: classDraft.level,
            choices: classDraft.choices,
          })
        : null

    const effectiveClasses = getEffectiveClassesForDeferredRequirements(
      character.classes,
      draftInstance,
    )

    if (effectiveClasses.length === 0) {
      setRequirements([])
      return
    }

    let isActive = true

    void resolveDeferredRequirementsForCharacter(
      effectiveClasses,
      catalog,
    ).then((resolved) => {
      if (!isActive) {
        return
      }

      setRequirements(resolved)
    })

    return () => {
      isActive = false
    }
  }, [activeInstanceId, catalog, character.classes, classDraft])

  return requirements
}
