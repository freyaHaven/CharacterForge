import type { FeatSelection } from './types'

function isFeatChoiceValue(value: unknown): value is string | string[] {
  if (typeof value === 'string') {
    return true
  }

  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  )
}

export function isFeatSelection(value: unknown): value is FeatSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (typeof candidate.featId !== 'string' || candidate.featId.length === 0) {
    return false
  }

  if (typeof candidate.choices !== 'object' || candidate.choices === null) {
    return false
  }

  const choices = candidate.choices as Record<string, unknown>

  return Object.values(choices).every(isFeatChoiceValue)
}
