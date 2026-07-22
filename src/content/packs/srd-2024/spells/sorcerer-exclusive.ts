import type { SpellDefinition } from '../../../../domain/spell/types'
import { defineSrd2024Spell } from './defineSpell'

/** Sorcerer-exclusive (and shared-missing) SRD spells not already in the catalogue. */
export const SRD_2024_SORCERER_EXCLUSIVE_SPELLS: SpellDefinition[] = [
  defineSrd2024Spell({
    slug: 'sorcerous-burst',
    name: 'Sorcerous Burst',
    level: 0,
    school: 'Evocation',
    castingTime: 'Action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description:
      'You cast forth a crackling burst of elemental energy at one creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d8 damage of a type you choose: Acid, Cold, Fire, Lightning, Poison, Psychic, or Thunder.\nIf you roll an 8 on a d8 for this spell, you can roll another d8 and add it to the damage. When you cast this spell, the maximum number of these d8s you can add to the spell\'s damage equals your spellcasting ability modifier.\nCantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).',
  }),
]
