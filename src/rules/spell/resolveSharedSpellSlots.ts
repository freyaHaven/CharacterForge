import type { ClassDefinition } from '../../domain/class/types'
import type { CharacterClassSelection } from '../../domain/class/types'
import type {
  SpellSlotContributor,
  SpellSlotRecovery,
} from '../../domain/spell/types'
import {
  FULL_CASTER_SLOTS_BY_LEVEL,
  highestSlotLevel,
  pactMagicAtLevel,
  slotsAtLevel,
} from '../../domain/spell/progressions'

export type SharedSpellSlots = {
  slotsByLevel: number[]
  highestSlotLevel: number
}

export type PactMagicSlotSource = {
  instanceId: string
  classId: string
  className: string
  classLevel: number
  slotCount: number
  slotLevel: number
  recovery: SpellSlotRecovery
}

export type PactMagicSlots = {
  sources: PactMagicSlotSource[]
}

type SlotContributorInstance = {
  level: number
  contributor: Extract<SpellSlotContributor, 'full' | 'half'>
  slotsByLevel: number[][]
}

function isConventionalSlotContributor(
  contributor: SpellSlotContributor,
): contributor is 'full' | 'half' {
  return contributor === 'full' || contributor === 'half'
}

/**
 * Derive shared spell slots for the character.
 * Only `full` and `half` contributors participate.
 * Pact Magic and `none` are ignored (never merged into this pool).
 * Single conventional caster → that class's slot table.
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

/**
 * Collect conventional (`full` / `half`) slot contributors only.
 * Pact Magic and non-casters are excluded from the shared pool.
 */
export function collectSlotContributors(
  instances: CharacterClassSelection[],
  definitionsById: Map<string, ClassDefinition>,
): SlotContributorInstance[] {
  const contributors: SlotContributorInstance[] = []

  for (const instance of instances) {
    const definition = definitionsById.get(instance.classId)
    const spellcasting = definition?.spellcasting
    if (spellcasting === undefined) {
      continue
    }

    if (!isConventionalSlotContributor(spellcasting.slotContributor)) {
      continue
    }

    contributors.push({
      level: instance.level,
      contributor: spellcasting.slotContributor,
      slotsByLevel: spellcasting.slotsByLevel,
    })
  }

  return contributors
}

/**
 * Resolve Pact Magic slots per class instance.
 * Multiple pact sources are listed separately (not summed) for P2.5.
 */
export function resolvePactMagicSlots(
  instances: CharacterClassSelection[],
  definitionsById: Map<string, ClassDefinition>,
): PactMagicSlots | null {
  const sources: PactMagicSlotSource[] = []

  for (const instance of instances) {
    const definition = definitionsById.get(instance.classId)
    const spellcasting = definition?.spellcasting
    if (spellcasting === undefined || spellcasting.slotContributor !== 'pact') {
      continue
    }

    const pactTable = spellcasting.pactSlotsByLevel
    if (pactTable === undefined || pactTable.length === 0) {
      continue
    }

    const row = pactMagicAtLevel(pactTable, instance.level)
    if (row === null || row.slotCount <= 0) {
      continue
    }

    sources.push({
      instanceId: instance.instanceId,
      classId: instance.classId,
      className: definition.name,
      classLevel: instance.level,
      slotCount: row.slotCount,
      slotLevel: row.slotLevel,
      recovery: spellcasting.slotRecovery ?? 'short-rest',
    })
  }

  if (sources.length === 0) {
    return null
  }

  return { sources }
}
