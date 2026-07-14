import type { EditionId } from '../types'
import type { ClassDefinition } from '../class/types'

export interface ClassCatalog {
  listClasses(editionId: EditionId): Promise<ClassDefinition[]>

  getClass(classId: string): Promise<ClassDefinition | null>
}
