import { getAbilityModifier } from '../../domain/abilities'
import {
  ABILITY_SCORE_ENTRIES,
  type AbilityScoreKey,
} from './abilityScoreDisplay'

export type AbilityScoreBonusLine = {
  readonly amount: number
  readonly sourceLabel: string
}

export type AbilityScoreBreakdownEntry = {
  readonly abilityKey: AbilityScoreKey
  readonly label: string
  readonly abbreviation: string
  readonly baseScore: number | null
  readonly bonuses: readonly AbilityScoreBonusLine[]
  readonly setScore: number | null
  readonly stackingBonus: number | null
  readonly otherModifier: number | null
  readonly override: number | null
  readonly totalScore: number | null
  readonly modifier: number | null
}

export type AbilityScoreBonusMap = Partial<
  Record<AbilityScoreKey, readonly AbilityScoreBonusLine[]>
>

function sumBonuses(bonuses: readonly AbilityScoreBonusLine[]): number {
  return bonuses.reduce((sum, bonus) => sum + bonus.amount, 0)
}

function resolveTotalScore(options: {
  baseScore: number | null
  bonuses: readonly AbilityScoreBonusLine[]
  setScore: number | null
  stackingBonus: number | null
  otherModifier: number | null
  override: number | null
}): number | null {
  if (options.override !== null) {
    return options.override
  }

  if (options.baseScore === null && options.setScore === null) {
    return null
  }

  const base = options.setScore ?? options.baseScore ?? 0
  return (
    base +
    sumBonuses(options.bonuses) +
    (options.stackingBonus ?? 0) +
    (options.otherModifier ?? 0)
  )
}

export function buildAbilityScoreBreakdown(options: {
  baseScores: Partial<Record<AbilityScoreKey, number | null>>
  bonuses?: AbilityScoreBonusMap
}): AbilityScoreBreakdownEntry[] {
  const bonusMap = options.bonuses ?? {}

  return ABILITY_SCORE_ENTRIES.map(({ key, label, abbreviation }) => {
    const baseScore = options.baseScores[key] ?? null
    const bonuses = bonusMap[key] ?? []
    const setScore = null
    const stackingBonus = null
    const otherModifier = null
    const override = null
    const totalScore = resolveTotalScore({
      baseScore,
      bonuses,
      setScore,
      stackingBonus,
      otherModifier,
      override,
    })

    return {
      abilityKey: key,
      label,
      abbreviation,
      baseScore,
      bonuses,
      setScore,
      stackingBonus,
      otherModifier,
      override,
      totalScore,
      modifier: totalScore === null ? null : getAbilityModifier(totalScore),
    }
  })
}
