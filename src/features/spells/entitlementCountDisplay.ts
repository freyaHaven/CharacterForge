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

/**
 * Accordion / section title for a spell-level catalogue partition.
 * e.g. "Cantrips", "1st-level Spells".
 */
export function formatSpellLevelSectionLabel(level: number): string {
  if (level <= 0) {
    return 'Cantrips'
  }

  return `${formatSpellLevelBandLabel(level).replace(/ level$/i, '-level')} Spells`
}

/**
 * How a child spell-level group relates to selection limits.
 * - entitlement — partition/filter only; quota lives on the entitlement header
 * - group — this level has its own independently enforced pick limit
 * - informational — no pick limit (granted/browse-only style)
 */
export type SpellLevelLimitScope = 'entitlement' | 'group' | 'informational'

export type SpellLevelCountRow = {
  level: number
  label: string
  selected: number
  /**
   * Genuine per-group pick limit when `limitScope === 'group'`.
   * Null for entitlement-wide or informational groups (never spell-slot counts).
   */
  capacity: number | null
  limitScope: SpellLevelLimitScope
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
 *
 * Child level rows are catalogue partitions by default. Pass
 * `groupLimitsByLevel` only when a level truly has its own pick budget.
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
  /**
   * Optional genuine per-level pick limits (not spell-slot totals).
   * When omitted, child rows are entitlement-scoped (no `/N` denominator).
   */
  groupLimitsByLevel?: ReadonlyMap<number, number> | null
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

  const levelRows: SpellLevelCountRow[] = levels.map((level) => {
    const groupLimit = input.groupLimitsByLevel?.get(level)
    const hasGroupLimit =
      groupLimit !== undefined && Number.isFinite(groupLimit) && groupLimit >= 0

    return {
      level,
      label: formatSpellLevelBandLabel(level),
      selected: selectedByLevel.get(level) ?? 0,
      capacity: hasGroupLimit ? groupLimit : null,
      limitScope: hasGroupLimit ? 'group' : 'entitlement',
    }
  })

  return {
    countLabel: `${used}/${input.limit}`,
    levelRows,
  }
}

/**
 * Compact secondary count for a child level row.
 * Entitlement-scoped rows never show a `/N` denominator (slots are not pick budgets).
 */
export function formatLevelCountValue(row: SpellLevelCountRow): string | null {
  if (row.limitScope === 'group' && row.capacity !== null) {
    return `${row.selected}/${row.capacity}`
  }

  if (row.selected <= 0) {
    return null
  }

  return row.selected === 1 ? '1 selected' : `${row.selected} selected`
}

/**
 * Collapsed accordion action text for a spell-level partition.
 */
export function formatSpellLevelAccordionSummary(input: {
  label: string
  selectedNames: readonly string[]
  eligibleCount: number
}): string {
  if (input.selectedNames.length > 0) {
    if (input.selectedNames.length <= 2) {
      return input.selectedNames.join(', ')
    }
    return `${input.selectedNames.length} selected`
  }

  if (input.eligibleCount <= 0) {
    return 'No additional spells available'
  }

  const hyphenated = input.label.replace(/ level$/i, '-level')
  return `Browse ${hyphenated} spells`
}
