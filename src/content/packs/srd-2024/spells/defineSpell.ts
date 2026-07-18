import type { SpellDefinition } from '../../../../domain/spell/types'
import { SRD_2024_SOURCE } from '../source'

export function defineSrd2024Spell(
  slug: string,
  name: string,
  level: number,
  school: string,
): SpellDefinition {
  return {
    id: `srd-2024:${slug}`,
    editionId: 'srd-2024',
    name,
    level,
    school,
    source: SRD_2024_SOURCE,
  }
}
