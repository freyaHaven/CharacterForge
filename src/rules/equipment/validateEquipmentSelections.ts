import type { ResolvedEquipment } from '../character/resolveCharacterEquipment'

export type EquipmentValidationIssue = {
  code: 'incomplete-choice'
  sourceLabel: string
  entitlementId: string
  message: string
}

export type EquipmentValidationResult = {
  ok: boolean
  issues: EquipmentValidationIssue[]
}

export function validateResolvedEquipment(
  resolved: ResolvedEquipment,
): EquipmentValidationResult {
  const issues: EquipmentValidationIssue[] = []

  for (const source of resolved.sources) {
    for (const entitlement of source.entitlements) {
      if (entitlement.isComplete) {
        continue
      }

      issues.push({
        code: 'incomplete-choice',
        sourceLabel: source.label,
        entitlementId: entitlement.entitlement.id,
        message: `${source.label} — choose ${entitlement.entitlement.label ?? entitlement.entitlement.id}`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}
