/**
 * Level band labels for Spells hierarchy summaries.
 * Distinct from card metadata (`formatSpellLevelLabel`), which uses "1st-level".
 */
export function formatSpellLevelBandLabel(level: number): string {
  if (level <= 0) {
    return 'Cantrips'
  }

  if (level === 1) {
    return '1st level'
  }

  if (level === 2) {
    return '2nd level'
  }

  if (level === 3) {
    return '3rd level'
  }

  return `${level}th level`
}

export type SpellLevelCountRow = {
  level: number
  label: string
  selected: number
  /** Spell slots at this level when known; null when not applicable. */
  capacity: number | null
}

export type EntitlementCountDisplay = {
  /** Heading count, e.g. "0/2 (1st level)" or "3/5". */
  countLabel: string
  /**
   * Per-level rows when more than one spell level is available.
   * Empty for a single accessible level (level is inlined in `countLabel`).
   */
  levelRows: SpellLevelCountRow[]
}

function slotsForSpellLevel(
  slotsByLevel: readonly number[] | null | undefined,
  spellLevel: number,
): number | null {
  if (spellLevel <= 0 || slotsByLevel === undefined || slotsByLevel === null) {
    return null
  }
  const count = slotsByLevel[spellLevel - 1]
  return count === undefined ? null : count
}

function shouldInlineSingleLevel(
  entitlementLabel: string,
  level: number,
): boolean {
  if (level <= 0 && /cantrip/i.test(entitlementLabel)) {
    return false
  }
  return true
}

/**
 * Build compact vs expanded count presentation for a select entitlement.
 */
export function buildEntitlementCountDisplay(input: {
  entitlementLabel: string
  limit: number
  accessibleLevels: readonly number[]
  /** Spell id → level for selected (and other) spells. */
  spellLevelById: ReadonlyMap<string, number>
  selectedSpellIds: readonly string[]
  /** Levels of granted spells that count against the selection limit. */
  countingGrantLevels?: readonly number[]
  /** Shared multiclass/class slots by spell level (index 0 = 1st level). */
  slotsByLevel?: readonly number[] | null
}): EntitlementCountDisplay {
  const countingGrantLevels = input.countingGrantLevels ?? []
  const used = input.selectedSpellIds.length + countingGrantLevels.length
  const levels = [...input.accessibleLevels].sort((a, b) => a - b)

  const selectedByLevel = new Map<number, number>()
  for (const level of levels) {
    selectedByLevel.set(level, 0)
  }

  for (const spellId of input.selectedSpellIds) {
    const level = input.spellLevelById.get(spellId)
    if (level === undefined) {
      continue
    }
    selectedByLevel.set(level, (selectedByLevel.get(level) ?? 0) + 1)
  }

  for (const level of countingGrantLevels) {
    selectedByLevel.set(level, (selectedByLevel.get(level) ?? 0) + 1)
  }

  if (levels.length <= 1) {
    const level = levels[0]
    const base = `${used}/${input.limit}`
    if (
      level === undefined ||
      !shouldInlineSingleLevel(input.entitlementLabel, level)
    ) {
      return { countLabel: base, levelRows: [] }
    }

    return {
      countLabel: `${base} (${formatSpellLevelBandLabel(level)})`,
      levelRows: [],
    }
  }

  const levelRows: SpellLevelCountRow[] = levels.map((level) => ({
    level,
    label: formatSpellLevelBandLabel(level),
    selected: selectedByLevel.get(level) ?? 0,
    capacity: slotsForSpellLevel(input.slotsByLevel, level),
  }))

  return {
    countLabel: `${used}/${input.limit}`,
    levelRows,
  }
}

export function formatLevelCountValue(row: SpellLevelCountRow): string {
  if (row.capacity === null) {
    return String(row.selected)
  }
  return `${row.selected}/${row.capacity}`
}
