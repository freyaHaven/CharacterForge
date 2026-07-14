import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { EditionId } from '../domain/types'
import type { ClassDefinition } from '../domain/class/types'
import { fighterSrd2024 } from '../data/classes/srd-2024/fighter'

const CLASSES_BY_ID = new Map<string, ClassDefinition>(
  [fighterSrd2024].map((classDefinition) => [
    classDefinition.id,
    classDefinition,
  ]),
)

const CLASSES_BY_EDITION = new Map<EditionId, ClassDefinition[]>([
  ['srd-2024', [fighterSrd2024]],
  ['srd-2014', []],
])

export function createBundledClassCatalog(): ClassCatalog {
  return {
    async listClasses(editionId) {
      return CLASSES_BY_EDITION.get(editionId) ?? []
    },

    async getClass(classId) {
      return CLASSES_BY_ID.get(classId) ?? null
    },
  }
}
