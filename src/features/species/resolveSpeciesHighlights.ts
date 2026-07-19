import type {
  MovementSpeed,
  SpeciesDefinition,
  SpeciesEffect,
} from '../../domain/species/types'
import { resolveSpeciesEffects } from '../../rules/species/resolveSpeciesEffects'

export type SpeciesHighlightSense = {
  kind: 'darkvision'
  label: string
  detail: string
}

export type SpeciesHighlightMovement = {
  kind: 'fly' | 'swim' | 'climb' | 'burrow'
  label: string
  detail: string
}

export type SpeciesHighlights = {
  senses: SpeciesHighlightSense[]
  movement: SpeciesHighlightMovement[]
}

function formatFeet(rangeFeet: number): string {
  return `${rangeFeet} ft.`
}

function senseFromEffect(effect: SpeciesEffect): SpeciesHighlightSense | null {
  if (effect.kind === 'darkvision') {
    return {
      kind: 'darkvision',
      label: 'Darkvision',
      detail: formatFeet(effect.rangeFeet),
    }
  }

  return null
}

const ALTERNATE_SPEED_KINDS = ['fly', 'swim', 'climb', 'burrow'] as const

function movementFromSpeed(speed: MovementSpeed): SpeciesHighlightMovement[] {
  const movement: SpeciesHighlightMovement[] = []

  for (const kind of ALTERNATE_SPEED_KINDS) {
    const value = speed[kind]
    if (value === undefined) {
      continue
    }

    const label =
      kind === 'fly'
        ? 'Fly Speed'
        : kind === 'swim'
          ? 'Swim Speed'
          : kind === 'climb'
            ? 'Climb Speed'
            : 'Burrow Speed'

    movement.push({
      kind,
      label,
      detail: formatFeet(value),
    })
  }

  return movement
}

/**
 * Quick-reference passive physical characteristics for the Species Highlights panel.
 * Derives senses from resolved effects; alternate movement from definition.speed.
 * Does not include feature traits (resistance, Breath Weapon, etc.).
 */
export function resolveSpeciesHighlights(
  definition: SpeciesDefinition,
  selectionChoices: Record<string, string | string[]> = {},
): SpeciesHighlights {
  const effects = resolveSpeciesEffects(definition, {
    speciesId: definition.id,
    choices: selectionChoices,
  })

  let darkvision: SpeciesHighlightSense | null = null
  let darkvisionRangeFeet = -1

  for (const effect of effects) {
    if (effect.kind !== 'darkvision') {
      continue
    }

    if (effect.rangeFeet > darkvisionRangeFeet) {
      darkvisionRangeFeet = effect.rangeFeet
      darkvision = senseFromEffect(effect)
    }
  }

  return {
    senses: darkvision === null ? [] : [darkvision],
    movement: movementFromSpeed(definition.speed),
  }
}

export function hasSpeciesHighlights(highlights: SpeciesHighlights): boolean {
  return highlights.senses.length > 0 || highlights.movement.length > 0
}
