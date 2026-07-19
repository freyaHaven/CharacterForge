import type {
  SpeciesChoiceOption,
  SpeciesDefinition,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'

const ANCESTRY_OR_LINEAGE_CHOICE_PATTERN =
  /-(?:ancestry|lineage|legacy)$/

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Normalize separators so "Wood Elf" / "Wood-Elf" compare equivalently.
 */
export function normalizeSpeciesIdentityToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
}

/**
 * True when the lineage/ancestry label already contains the full species name
 * (case-insensitive; spaces and hyphens treated as equivalent separators).
 */
export function lineageIncludesSpeciesName(
  lineageName: string,
  speciesName: string,
): boolean {
  const normalizedLineage = normalizeSpeciesIdentityToken(lineageName)
  const normalizedSpecies = normalizeSpeciesIdentityToken(speciesName)

  if (normalizedSpecies.length === 0) {
    return false
  }

  const pattern = new RegExp(
    `(?:^| )${escapeRegExp(normalizedSpecies)}(?: |$)`,
  )
  return pattern.test(normalizedLineage)
}

/**
 * Pure display-name formatter.
 *
 * - No lineage → species name
 * - Lineage already includes species → lineage alone
 * - Otherwise → `{lineage} {species}`
 */
export function formatSpeciesDisplayName(
  speciesName: string,
  selectedLineage: string | null | undefined,
): string {
  const species = speciesName.trim()
  const lineage = selectedLineage?.trim()

  if (lineage === undefined || lineage.length === 0) {
    return species
  }

  if (species.length === 0) {
    return lineage
  }

  if (lineageIncludesSpeciesName(lineage, species)) {
    return lineage
  }

  return `${lineage} ${species}`
}

/**
 * Derive a compact ancestry/lineage label from an option label.
 *
 * - `Black (Acid)` → `Black` (single-token parenthesis is metadata)
 * - `Storm's Thunder (Storm Giant)` → `Storm Giant` (multi-word parenthesis
 *   is the ancestral identity)
 * - `Wood Elf` → `Wood Elf`
 */
export function lineageLabelForDisplay(optionLabel: string): string {
  const trimmed = optionLabel.trim()
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(trimmed)

  if (match === null) {
    return trimmed
  }

  const before = match[1]?.trim() ?? ''
  const inside = match[2]?.trim() ?? ''

  if (inside.length === 0) {
    return before.length > 0 ? before : trimmed
  }

  // Single token in parentheses (e.g. damage type) — drop it.
  if (!/[\s-]/.test(inside)) {
    return before.length > 0 ? before : trimmed
  }

  // Multi-word / hyphenated parenthesis — use as the ancestry name.
  return inside
}

export function isAncestryOrLineageChoiceId(choiceId: string): boolean {
  return ANCESTRY_OR_LINEAGE_CHOICE_PATTERN.test(choiceId)
}

/**
 * Resolve the selected ancestry/lineage/legacy option.
 * Ignores unrelated choices (size, skills, spellcasting ability, etc.).
 */
export function resolveSelectedLineageOption(
  definition: Pick<SpeciesDefinition, 'choices'>,
  selectionChoices: Record<string, SpeciesSelectionChoiceValue>,
): SpeciesChoiceOption | null {
  for (const choice of definition.choices) {
    if (!isAncestryOrLineageChoiceId(choice.id)) {
      continue
    }

    const selectedOptionId = selectionChoices[choice.id]
    if (typeof selectedOptionId !== 'string') {
      continue
    }

    const option = choice.options.find(
      (candidate) => candidate.id === selectedOptionId,
    )
    if (option !== undefined) {
      return option
    }
  }

  return null
}

/**
 * Compact ancestry/lineage label used when composing identity display names.
 */
export function resolveSelectedLineageLabel(
  definition: Pick<SpeciesDefinition, 'choices'>,
  selectionChoices: Record<string, SpeciesSelectionChoiceValue>,
): string | null {
  const option = resolveSelectedLineageOption(definition, selectionChoices)
  if (option === null) {
    return null
  }

  return lineageLabelForDisplay(option.label)
}

/**
 * Derived species display name for identity surfaces.
 * Does not mutate stored species or choice IDs.
 */
export function getSpeciesDisplayName(
  definition: Pick<SpeciesDefinition, 'name' | 'choices'>,
  selectionChoices: Record<string, SpeciesSelectionChoiceValue> = {},
): string {
  return formatSpeciesDisplayName(
    definition.name,
    resolveSelectedLineageLabel(definition, selectionChoices),
  )
}
