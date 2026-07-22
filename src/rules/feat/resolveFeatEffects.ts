import type { FeatDefinition, FeatEffect } from '../../domain/feat/types'
import type { ResolvedFeatGrant } from '../character/resolveCharacterFeatGrants'

export function resolveFeatDefinitionEffects(
  definition: FeatDefinition,
): FeatEffect[] {
  return definition.effects !== undefined ? [...definition.effects] : []
}

/**
 * Collect creator-time feat effects from resolved grants + definitions.
 */
export function resolveCharacterFeatEffects(
  grants: readonly ResolvedFeatGrant[],
  definitionsById: ReadonlyMap<string, FeatDefinition>,
): FeatEffect[] {
  const effects: FeatEffect[] = []

  for (const grant of grants) {
    const definition = definitionsById.get(grant.featId)
    if (definition === undefined) {
      continue
    }
    effects.push(...resolveFeatDefinitionEffects(definition))
  }

  return effects
}

export function hasInitiativeProficiency(
  effects: readonly FeatEffect[],
): boolean {
  return effects.some((effect) => effect.kind === 'initiative-proficiency')
}

/**
 * Sum unique armor-class-bonus feat effects that apply given wear state.
 * Duplicate grants of the same non-repeatable feat are already blocked upstream;
 * this still caps by summing distinct effect descriptors once each.
 */
export function resolveArmorClassBonusFromFeatEffects(
  effects: readonly FeatEffect[],
  wearingArmor: boolean,
): number {
  let bonus = 0
  const seen = new Set<string>()

  for (const effect of effects) {
    if (effect.kind !== 'armor-class-bonus') {
      continue
    }

    if (effect.when === 'wearing-armor' && !wearingArmor) {
      continue
    }

    const key = `${effect.amount}:${effect.when ?? 'always'}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    bonus += effect.amount
  }

  return bonus
}

export type ResolvedFeatSense = {
  sense: string
  label: string
  detail: string
}

const SENSE_LABELS: Record<string, string> = {
  darkvision: 'Darkvision',
  blindsight: 'Blindsight',
  tremorsense: 'Tremorsense',
  truesight: 'Truesight',
}

export function resolveSensesFromFeatEffects(
  effects: readonly FeatEffect[],
): ResolvedFeatSense[] {
  const senses: ResolvedFeatSense[] = []
  const seen = new Set<string>()

  for (const effect of effects) {
    if (effect.kind !== 'sense') {
      continue
    }
    const key = `${effect.sense}:${effect.rangeFeet}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    senses.push({
      sense: effect.sense,
      label: SENSE_LABELS[effect.sense] ?? effect.sense,
      detail: `${effect.rangeFeet} ft.`,
    })
  }

  return senses
}

export type ResolvedFeatResistance = {
  label: string
  detail: string
}

function formatDamageTypeLabel(damageType: string): string {
  return damageType.charAt(0).toUpperCase() + damageType.slice(1)
}

export function resolveResistancesFromFeatEffects(
  effects: readonly FeatEffect[],
): ResolvedFeatResistance[] {
  const resistances: ResolvedFeatResistance[] = []
  const seen = new Set<string>()

  for (const effect of effects) {
    if (effect.kind !== 'damage-resistance') {
      continue
    }

    let label: string
    let detail: string
    if (effect.except !== undefined && effect.except.length > 0) {
      label = 'Resistance (all except listed)'
      detail = `Except ${effect.except.map(formatDamageTypeLabel).join(', ')}`
    } else if (effect.damageType !== undefined) {
      label = `Resistance (${formatDamageTypeLabel(effect.damageType)})`
      detail = formatDamageTypeLabel(effect.damageType)
    } else {
      continue
    }

    if (effect.when === 'dim-light-or-darkness') {
      detail = `${detail} · while in Dim Light or Darkness`
    }

    const key = `${label}:${detail}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    resistances.push({ label, detail })
  }

  return resistances
}
