import type { ClassDefinition } from '../../domain/class/types'

function getCatalogOrder(classDefinition: ClassDefinition): number {
  return classDefinition.catalogOrder ?? 1000
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
