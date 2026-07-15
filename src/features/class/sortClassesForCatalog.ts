import type { ClassDefinition } from '../../domain/class/types'

const CLASS_CATALOG_ORDER: Record<string, number> = {
  'srd-2024:fighter': 10,
  'srd-2014:fighter': 10,
  'srd-2024:rogue': 20,
  'srd-2014:rogue': 20,
  'srd-2024:artificer': 30,
  'srd-2014:artificer': 30,
}

function getCatalogOrder(classDefinition: ClassDefinition): number {
  return CLASS_CATALOG_ORDER[classDefinition.id] ?? 1000
}

export function sortClassesForCatalog(
  classes: readonly ClassDefinition[],
): ClassDefinition[] {
  return [...classes].sort((left, right) => {
    const orderDifference = getCatalogOrder(left) - getCatalogOrder(right)

    if (orderDifference !== 0) {
      return orderDifference
    }

    return left.name.localeCompare(right.name)
  })
}
