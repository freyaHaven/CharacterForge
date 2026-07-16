const CONTEXT_SEPARATOR = ' • '

export type RecentCharacterClassSummary = {
  className: string
  level: number
}

export type RecentCharacterSummary = {
  id: string
  name: string
  speciesName: string | null
  classes: RecentCharacterClassSummary[]
  updatedAt: number
}

export function formatRecentCharacterIdentityLine(
  name: string,
  speciesName: string | null,
): string {
  const trimmedName = name.trim()
  const displayName = trimmedName.length > 0 ? trimmedName : 'Unnamed'
  const segments = [displayName]

  if (speciesName !== null && speciesName.trim().length > 0) {
    segments.push(speciesName.trim())
  }

  return segments.join(CONTEXT_SEPARATOR)
}

export function formatRecentCharacterBuildLine(
  classes: RecentCharacterClassSummary[],
): string | null {
  if (classes.length === 0) {
    return null
  }

  return classes
    .map((entry) => `${entry.className} ${entry.level}`)
    .join(CONTEXT_SEPARATOR)
}

const MS_PER_MINUTE = 60_000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Formats a recent-edit timestamp for Home cards.
 * Examples: "Just now", "2 hours ago", "Yesterday", "Jul 15"
 */
export function formatRecentEditedLabel(
  updatedAt: number,
  now: number = Date.now(),
): string {
  const elapsed = Math.max(0, now - updatedAt)

  if (elapsed < MS_PER_MINUTE) {
    return 'Just now'
  }

  if (elapsed < MS_PER_HOUR) {
    const minutes = Math.floor(elapsed / MS_PER_MINUTE)
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  if (elapsed < MS_PER_DAY) {
    const hours = Math.floor(elapsed / MS_PER_HOUR)
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  const updatedDay = startOfLocalDay(new Date(updatedAt))
  const today = startOfLocalDay(new Date(now))
  const dayDiff = Math.round((today - updatedDay) / MS_PER_DAY)

  if (dayDiff === 1) {
    return 'Yesterday'
  }

  if (dayDiff < 7) {
    return `${dayDiff} days ago`
  }

  return new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
