/**
 * Contextual storage for feat sub-choices under a grant slot.
 *
 * Host maps (class instance choices, species choices) keep the grant id
 * (e.g. `ability-score-improvement-4` → `feat:srd-2024:skilled`) and store
 * nested picks beside it as:
 *   `feat-choices:{grantSlotId}:{featChoiceId}` → string | string[]
 *
 * No Character-level feat state is required.
 */

export const FEAT_GRANT_CHOICES_KEY_PREFIX = 'feat-choices:' as const

export type FeatGrantChoiceStorageKeyParts = {
  grantSlotId: string
  featChoiceId: string
}

export function createFeatGrantChoiceStorageKey(
  grantSlotId: string,
  featChoiceId: string,
): string {
  return `${FEAT_GRANT_CHOICES_KEY_PREFIX}${grantSlotId}:${featChoiceId}`
}

export function parseFeatGrantChoiceStorageKey(
  key: string,
): FeatGrantChoiceStorageKeyParts | null {
  if (!key.startsWith(FEAT_GRANT_CHOICES_KEY_PREFIX)) {
    return null
  }

  const rest = key.slice(FEAT_GRANT_CHOICES_KEY_PREFIX.length)
  const separator = rest.lastIndexOf(':')
  if (separator <= 0 || separator === rest.length - 1) {
    return null
  }

  // grantSlotId may contain colons (unlikely) — split on first colon after prefix
  // Format: feat-choices:{grantSlotId}:{featChoiceId}
  // grantSlotId is the class/species choice id (no colons today).
  const firstColon = rest.indexOf(':')
  if (firstColon <= 0 || firstColon === rest.length - 1) {
    return null
  }

  return {
    grantSlotId: rest.slice(0, firstColon),
    featChoiceId: rest.slice(firstColon + 1),
  }
}

export function isFeatGrantChoiceStorageKey(key: string): boolean {
  return parseFeatGrantChoiceStorageKey(key) !== null
}

export type HostChoiceMap = Record<string, string | string[] | undefined>

/** Read all nested feat choices for a grant slot. */
export function readFeatGrantChoices(
  hostChoices: HostChoiceMap,
  grantSlotId: string,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(hostChoices)) {
    const parsed = parseFeatGrantChoiceStorageKey(key)
    if (parsed === null || parsed.grantSlotId !== grantSlotId) {
      continue
    }
    if (value === undefined) {
      continue
    }
    result[parsed.featChoiceId] = value
  }

  return result
}

export function writeFeatGrantChoice(
  hostChoices: HostChoiceMap,
  grantSlotId: string,
  featChoiceId: string,
  value: string | string[] | undefined,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}
  for (const [key, entry] of Object.entries(hostChoices)) {
    if (entry !== undefined) {
      next[key] = entry
    }
  }

  const storageKey = createFeatGrantChoiceStorageKey(grantSlotId, featChoiceId)
  if (value === undefined) {
    delete next[storageKey]
  } else {
    next[storageKey] = value
  }

  return next
}

/** Remove every nested feat-choice key for a grant slot. */
export function clearFeatGrantChoices(
  hostChoices: HostChoiceMap,
  grantSlotId: string,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(hostChoices)) {
    if (value === undefined) {
      continue
    }
    const parsed = parseFeatGrantChoiceStorageKey(key)
    if (parsed !== null && parsed.grantSlotId === grantSlotId) {
      continue
    }
    next[key] = value
  }

  return next
}

/**
 * Keep companion keys only for active grant slots listed in `activeGrantSlotIds`.
 * Does not inspect feat definitions — callers prune further when the granted
 * feat id changes.
 */
export function pruneOrphanFeatGrantChoiceKeys(
  hostChoices: HostChoiceMap,
  activeGrantSlotIds: ReadonlySet<string>,
): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}

  for (const [key, value] of Object.entries(hostChoices)) {
    if (value === undefined) {
      continue
    }
    const parsed = parseFeatGrantChoiceStorageKey(key)
    if (parsed !== null && !activeGrantSlotIds.has(parsed.grantSlotId)) {
      continue
    }
    next[key] = value
  }

  return next
}
