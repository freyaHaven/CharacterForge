/**
 * Companion storage for nested picks under a selected class multi-select option
 * (e.g. Eldritch Invocation cantrip / pact weapon / familiar form).
 *
 * Format: `invocation-choices:{choiceId}:{optionId}` → string | string[]
 *
 * Reuses the same host map as class choices (CharacterClassSelection.choices).
 */

export const INVOCATION_CHOICES_KEY_PREFIX = 'invocation-choices:' as const

export type InvocationChoiceStorageKeyParts = {
  choiceId: string
  optionId: string
}

export function createInvocationChoiceStorageKey(
  choiceId: string,
  optionId: string,
): string {
  return `${INVOCATION_CHOICES_KEY_PREFIX}${choiceId}:${optionId}`
}

export function parseInvocationChoiceStorageKey(
  key: string,
): InvocationChoiceStorageKeyParts | null {
  if (!key.startsWith(INVOCATION_CHOICES_KEY_PREFIX)) {
    return null
  }

  const rest = key.slice(INVOCATION_CHOICES_KEY_PREFIX.length)
  const separator = rest.indexOf(':')
  if (separator <= 0 || separator === rest.length - 1) {
    return null
  }

  return {
    choiceId: rest.slice(0, separator),
    optionId: rest.slice(separator + 1),
  }
}

export function isInvocationChoiceStorageKey(key: string): boolean {
  return parseInvocationChoiceStorageKey(key) !== null
}

export type HostChoiceMap = Record<string, string | string[] | undefined>

export function readInvocationChoice(
  hostChoices: HostChoiceMap,
  choiceId: string,
  optionId: string,
): string | string[] | undefined {
  return hostChoices[createInvocationChoiceStorageKey(choiceId, optionId)]
}

export function writeInvocationChoice(
  hostChoices: HostChoiceMap,
  choiceId: string,
  optionId: string,
  value: string | string[] | undefined,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}
  for (const [key, entry] of Object.entries(hostChoices)) {
    if (entry !== undefined) {
      next[key] = entry
    }
  }

  const storageKey = createInvocationChoiceStorageKey(choiceId, optionId)
  if (value === undefined) {
    delete next[storageKey]
  } else {
    next[storageKey] = value
  }

  return next
}

/**
 * Keep companion keys only for option ids currently selected on `choiceId`.
 */
export function pruneOrphanInvocationChoiceKeys(
  hostChoices: HostChoiceMap,
  choiceId: string,
  selectedOptionIds: ReadonlySet<string>,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(hostChoices)) {
    if (value === undefined) {
      continue
    }
    const parsed = parseInvocationChoiceStorageKey(key)
    if (
      parsed !== null &&
      parsed.choiceId === choiceId &&
      !selectedOptionIds.has(parsed.optionId)
    ) {
      continue
    }
    next[key] = value
  }

  return next
}

/** Drop every invocation companion key (e.g. when the parent choice is gone). */
export function pruneAllInvocationChoiceKeys(
  hostChoices: HostChoiceMap,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(hostChoices)) {
    if (value === undefined) {
      continue
    }
    if (isInvocationChoiceStorageKey(key)) {
      continue
    }
    next[key] = value
  }

  return next
}
