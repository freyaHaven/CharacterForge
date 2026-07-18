import type { ClassDefinition } from '../../domain/class/types'
import type { CharacterClassSelection } from '../../domain/class/types'
import type { SpellSlotContributor } from '../../domain/spell/types'
import {
  FULL_CASTER_SLOTS_BY_LEVEL,
  highestSlotLevel,
  slotsAtLevel,
} from '../../domain/spell/progressions'

export type SharedSpellSlots = {
  slotsByLevel: number[]
  highestSlotLevel: number
}

type SlotContributorInstance = {
  level: number
  contributor: SpellSlotContributor
  slotsByLevel: number[][]
}

/**
 * Derive shared spell slots for the character.
 * Single spellcasting class → that class's slot table.
 * Multiple contributors → multiclass full-caster table from summed levels.
 */
export function resolveSharedSpellSlots(
  contributors: SlotContributorInstance[],
): SharedSpellSlots | null {
  if (contributors.length === 0) {
    return null
  }

  if (contributors.length === 1) {
    const only = contributors[0]!
    const slots = slotsAtLevel(only.slotsByLevel, only.level)
    return {
      slotsByLevel: slots,
      highestSlotLevel: highestSlotLevel(slots),
    }
  }

  let multiclassCasterLevel = 0
  for (const entry of contributors) {
    if (entry.contributor === 'full') {
      multiclassCasterLevel += entry.level
    } else {
      multiclassCasterLevel += Math.floor(entry.level / 2)
    }
  }

  if (multiclassCasterLevel < 1) {
    return { slotsByLevel: [], highestSlotLevel: 0 }
  }

  const slots = slotsAtLevel(FULL_CASTER_SLOTS_BY_LEVEL, multiclassCasterLevel)
  return {
    slotsByLevel: slots,
    highestSlotLevel: highestSlotLevel(slots),
  }
}

export function collectSlotContributors(
  instances: CharacterClassSelection[],
  definitionsById: Map<string, ClassDefinition>,
): SlotContributorInstance[] {
  const contributors: SlotContributorInstance[] = []

  for (const instance of instances) {
    const definition = definitionsById.get(instance.classId)
    if (definition?.spellcasting === undefined) {
      continue
    }

    contributors.push({
      level: instance.level,
      contributor: definition.spellcasting.slotContributor,
      slotsByLevel: definition.spellcasting.slotsByLevel,
    })
  }

  return contributors
}
