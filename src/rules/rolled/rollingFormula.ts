import type {
  DieValue,
  GeneratedAbilityScoreResult,
  RollingFormulaId,
  RolledDie,
} from './abilityScoreResult'
import { computeGeneratedTotal } from './abilityScoreResult'
import type { RandomSource } from './random'
import { rollD6 } from './random'

export const ROLLED_ABILITY_SCORE_COUNT = 6
export const ROLLED_MIN_TOTAL = 3
export const ROLLED_MAX_TOTAL = 18
export const DEFAULT_ROLLING_FORMULA_ID: RollingFormulaId = '4d6-drop-lowest'

export type RollingFormula = {
  readonly id: RollingFormulaId
  readonly label: string
  readonly description: string
  readonly minTotal: number
  readonly maxTotal: number
  readonly resolve: (rng: RandomSource) => GeneratedAbilityScoreResult
}

function resolve4d6DropLowest(rng: RandomSource): GeneratedAbilityScoreResult {
  const values: DieValue[] = [
    rollD6(rng),
    rollD6(rng),
    rollD6(rng),
    rollD6(rng),
  ]
  const lowestValue = Math.min(...values) as DieValue
  const droppedIndex = values.indexOf(lowestValue)

  const dice: RolledDie[] = values.map((value, index) => ({
    index,
    value,
    dropped: index === droppedIndex,
  }))

  const modifiers: GeneratedAbilityScoreResult['modifiers'] = []
  const total = computeGeneratedTotal(dice, modifiers)

  return {
    kind: 'generated',
    formulaId: '4d6-drop-lowest',
    dice,
    modifiers,
    total,
  }
}

const ROLLING_FORMULAS: Record<RollingFormulaId, RollingFormula> = {
  '4d6-drop-lowest': {
    id: '4d6-drop-lowest',
    label: '4d6, drop lowest',
    description: 'Roll four six-sided dice, drop the lowest die, and sum the rest.',
    minTotal: ROLLED_MIN_TOTAL,
    maxTotal: ROLLED_MAX_TOTAL,
    resolve: resolve4d6DropLowest,
  },
}

export function getRollingFormula(id: RollingFormulaId): RollingFormula {
  return ROLLING_FORMULAS[id]
}

export function listRollingFormulas(): readonly RollingFormula[] {
  return Object.values(ROLLING_FORMULAS)
}

export function generateAbilityScoreRoll(
  formulaId: RollingFormulaId,
  rng: RandomSource,
): GeneratedAbilityScoreResult {
  return getRollingFormula(formulaId).resolve(rng)
}

export function generateAbilityScorePool(
  count: number,
  formulaId: RollingFormulaId,
  rng: RandomSource,
): GeneratedAbilityScoreResult[] {
  return Array.from({ length: count }, () => generateAbilityScoreRoll(formulaId, rng))
}

export function isValidRolledTotal(total: number): boolean {
  return (
    Number.isInteger(total) &&
    total >= ROLLED_MIN_TOTAL &&
    total <= ROLLED_MAX_TOTAL
  )
}
