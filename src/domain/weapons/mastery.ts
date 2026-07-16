import {
  WEAPON_LABELS,
  type WeaponId,
} from './types'

export const WEAPON_MASTERY_PROPERTY_IDS = [
  'cleave',
  'graze',
  'nick',
  'push',
  'sap',
  'slow',
  'topple',
  'vex',
] as const

export type WeaponMasteryPropertyId =
  (typeof WEAPON_MASTERY_PROPERTY_IDS)[number]

export const WEAPON_MASTERY_PROPERTY_LABELS: Record<
  WeaponMasteryPropertyId,
  string
> = {
  cleave: 'Cleave',
  graze: 'Graze',
  nick: 'Nick',
  push: 'Push',
  sap: 'Sap',
  slow: 'Slow',
  topple: 'Topple',
  vex: 'Vex',
}

/**
 * Mastery property rules text. `{weapon}` is replaced with "a Greatsword" /
 * "an Axe" style phrasing when formatting for a specific weapon.
 */
export const WEAPON_MASTERY_PROPERTY_DESCRIPTIONS: Record<
  WeaponMasteryPropertyId,
  string
> = {
  cleave:
    'If you hit a creature with a melee attack roll using {weapon}, you can make a melee attack roll with the weapon against a second creature within 5 feet of the first that is also within your reach. On a hit, the second creature takes the weapon’s damage, but don’t add your ability modifier to that damage unless that modifier is negative. You can make this extra attack only once per turn.',
  graze:
    'If your attack roll with {weapon} misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the {Weapon}, and the damage can be increased only by increasing the ability modifier.',
  nick: 'When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.',
  push: 'If you hit a creature with {weapon}, you can push the creature up to 10 feet straight away from yourself if it is Large or smaller.',
  sap: 'If you hit a creature with {weapon}, that creature has Disadvantage on its next attack roll before the start of your next turn.',
  slow: 'If you hit a creature with {weapon} and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn’t exceed 10 feet.',
  topple:
    'If you hit a creature with {weapon}, you can force the creature to make a Constitution saving throw (DC 8 plus the ability modifier used to make the attack roll and your Proficiency Bonus). On a failed save, the creature has the Prone condition.',
  vex: 'If you hit a creature with {weapon} and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.',
}

/** SRD 2024 weapon → mastery property mapping. */
export const WEAPON_MASTERY_BY_WEAPON: Record<WeaponId, WeaponMasteryPropertyId> =
  {
    club: 'slow',
    dagger: 'nick',
    greatclub: 'push',
    handaxe: 'vex',
    javelin: 'slow',
    'light-hammer': 'nick',
    mace: 'sap',
    quarterstaff: 'topple',
    sickle: 'nick',
    spear: 'sap',
    'light-crossbow': 'slow',
    dart: 'vex',
    shortbow: 'vex',
    sling: 'slow',
    battleaxe: 'topple',
    flail: 'sap',
    glaive: 'graze',
    greataxe: 'cleave',
    greatsword: 'graze',
    halberd: 'cleave',
    lance: 'topple',
    longsword: 'sap',
    maul: 'topple',
    morningstar: 'sap',
    pike: 'push',
    rapier: 'vex',
    scimitar: 'nick',
    shortsword: 'vex',
    trident: 'topple',
    'war-pick': 'sap',
    warhammer: 'push',
    whip: 'slow',
    blowgun: 'vex',
    'hand-crossbow': 'vex',
    'heavy-crossbow': 'push',
    longbow: 'slow',
    musket: 'slow',
    pistol: 'vex',
  }

function weaponPhrase(weaponLabel: string): string {
  const article = /^[aeiou]/i.test(weaponLabel) ? 'an' : 'a'
  return `${article} ${weaponLabel}`
}

export function getWeaponMasteryPropertyId(
  weaponId: WeaponId,
): WeaponMasteryPropertyId {
  return WEAPON_MASTERY_BY_WEAPON[weaponId]
}

export function getWeaponMasteryPropertyLabel(weaponId: WeaponId): string {
  return WEAPON_MASTERY_PROPERTY_LABELS[getWeaponMasteryPropertyId(weaponId)]
}

export function formatWeaponMasteryDescription(weaponId: WeaponId): string {
  const propertyLabel = getWeaponMasteryPropertyLabel(weaponId)
  return `${propertyLabel}. ${formatWeaponMasteryDescriptionBody(weaponId)}`
}

/** Rules text only (no leading “Graze.”), for Overview nested entries. */
export function formatWeaponMasteryDescriptionBody(weaponId: WeaponId): string {
  const propertyId = getWeaponMasteryPropertyId(weaponId)
  const weaponLabel = WEAPON_LABELS[weaponId]

  return WEAPON_MASTERY_PROPERTY_DESCRIPTIONS[propertyId]
    .replaceAll('{weapon}', weaponPhrase(weaponLabel))
    .replaceAll('{Weapon}', weaponLabel)
}

export function formatWeaponMasteryOptionLabel(weaponId: WeaponId): string {
  return `${WEAPON_LABELS[weaponId]} (${getWeaponMasteryPropertyLabel(weaponId)})`
}
