import type { SpellDefinition } from '../../../../domain/spell/types'
import { defineSrd2024Spell } from './defineSpell'

/** Warlock-exclusive (and shared-missing) SRD spells not already in the catalogue. */
export const SRD_2024_WARLOCK_EXCLUSIVE_SPELLS: SpellDefinition[] = [
  defineSrd2024Spell({
    slug: 'eldritch-blast',
    name: 'Eldritch Blast',
    level: 0,
    school: 'Evocation',
    castingTime: 'Action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description:
      'You hurl a beam of crackling energy. Make a ranged spell attack against one creature or object within range. On a hit, the target takes 1d10 Force damage.\nCantrip Upgrade. The spell creates more than one beam when you reach higher levels: two beams at level 5, three beams at level 11, and four beams at level 17. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.',
  }),
  defineSrd2024Spell({
    slug: 'hex',
    name: 'Hex',
    level: 1,
    school: 'Enchantment',
    castingTime: 'Bonus Action',
    range: '90 feet',
    components: 'V, S, M',
    duration: 'Concentration, up to 1 hour',
    concentration: true,
    description:
      'You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 Necrotic damage to the target whenever you hit it with an attack roll. Also, choose one ability when you cast the spell. The target has Disadvantage on ability checks made with the chosen ability.\nIf the target drops to 0 Hit Points before this spell ends, you can use a Bonus Action on a subsequent turn to curse a new creature.',
  }),
]
