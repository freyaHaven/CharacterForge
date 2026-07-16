/** Simple and Martial weapon kinds usable for Weapon Mastery (SRD 2024). */
export const WEAPON_IDS = [
  'club',
  'dagger',
  'greatclub',
  'handaxe',
  'javelin',
  'light-hammer',
  'mace',
  'quarterstaff',
  'sickle',
  'spear',
  'light-crossbow',
  'dart',
  'shortbow',
  'sling',
  'battleaxe',
  'flail',
  'glaive',
  'greataxe',
  'greatsword',
  'halberd',
  'lance',
  'longsword',
  'maul',
  'morningstar',
  'pike',
  'rapier',
  'scimitar',
  'shortsword',
  'trident',
  'war-pick',
  'warhammer',
  'whip',
  'blowgun',
  'hand-crossbow',
  'heavy-crossbow',
  'longbow',
  'musket',
  'pistol',
] as const

export type WeaponId = (typeof WEAPON_IDS)[number]

/** Melee Simple and Martial weapons (Barbarian Weapon Mastery pool). */
export const MELEE_WEAPON_IDS = [
  'club',
  'dagger',
  'greatclub',
  'handaxe',
  'javelin',
  'light-hammer',
  'mace',
  'quarterstaff',
  'sickle',
  'spear',
  'battleaxe',
  'flail',
  'glaive',
  'greataxe',
  'greatsword',
  'halberd',
  'lance',
  'longsword',
  'maul',
  'morningstar',
  'pike',
  'rapier',
  'scimitar',
  'shortsword',
  'trident',
  'war-pick',
  'warhammer',
  'whip',
] as const satisfies readonly WeaponId[]

export type MeleeWeaponId = (typeof MELEE_WEAPON_IDS)[number]

export function isMeleeWeaponId(value: unknown): value is MeleeWeaponId {
  return (
    typeof value === 'string' &&
    (MELEE_WEAPON_IDS as readonly string[]).includes(value)
  )
}

export function isWeaponId(value: unknown): value is WeaponId {
  return (
    typeof value === 'string' &&
    (WEAPON_IDS as readonly string[]).includes(value)
  )
}

export const WEAPON_LABELS: Record<WeaponId, string> = {
  club: 'Club',
  dagger: 'Dagger',
  greatclub: 'Greatclub',
  handaxe: 'Handaxe',
  javelin: 'Javelin',
  'light-hammer': 'Light Hammer',
  mace: 'Mace',
  quarterstaff: 'Quarterstaff',
  sickle: 'Sickle',
  spear: 'Spear',
  'light-crossbow': 'Light Crossbow',
  dart: 'Dart',
  shortbow: 'Shortbow',
  sling: 'Sling',
  battleaxe: 'Battleaxe',
  flail: 'Flail',
  glaive: 'Glaive',
  greataxe: 'Greataxe',
  greatsword: 'Greatsword',
  halberd: 'Halberd',
  lance: 'Lance',
  longsword: 'Longsword',
  maul: 'Maul',
  morningstar: 'Morningstar',
  pike: 'Pike',
  rapier: 'Rapier',
  scimitar: 'Scimitar',
  shortsword: 'Shortsword',
  trident: 'Trident',
  'war-pick': 'War Pick',
  warhammer: 'Warhammer',
  whip: 'Whip',
  blowgun: 'Blowgun',
  'hand-crossbow': 'Hand Crossbow',
  'heavy-crossbow': 'Heavy Crossbow',
  longbow: 'Longbow',
  musket: 'Musket',
  pistol: 'Pistol',
}
