import type { SpellDefinition } from '../../../../domain/spell/types'
import { SRD_2024_SOURCE } from '../source'

export type Srd2024SpellInput = {
  slug: string
  name: string
  level: number
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  description: string
}

export function defineSrd2024Spell(input: Srd2024SpellInput): SpellDefinition {
  return {
    id: `srd-2024:${input.slug}`,
    editionId: 'srd-2024',
    name: input.name,
    level: input.level,
    school: input.school,
    castingTime: input.castingTime,
    range: input.range,
    components: input.components,
    duration: input.duration,
    description: input.description,
    source: SRD_2024_SOURCE,
  }
}
