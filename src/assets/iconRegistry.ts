/**
 * Centralized SVG/PNG lookups for species, class, and system artwork.
 *
 * Keys use the stable ID suffix (the part after `:` in SRD ids such as
 * `srd-2024:fighter`). Aliases cover filename quirks and common alternate
 * suffixes so future SRD / homebrew content can resolve without scattered imports.
 */

import aasimarRace from './races/aasimar.svg'
import dragonbornRace from './races/dragonborn.svg'
import dwarfRace from './races/dwarf.svg'
import elfRace from './races/elf.svg'
import gnomeRace from './races/gnome.svg'
import goliathRace from './races/goliath.svg'
import halfElfRace from './races/half_elf.svg'
import halfOrcRace from './races/half_orc.svg'
import halflingRace from './races/halfling.svg'
import humanRace from './races/human.svg'
import orcRace from './races/orc.svg'
import tieflingRace from './races/tiefling.svg'

import alchemistIcon from './classes/icon/alchemist.png'
import archerIcon from './classes/icon/archer.png'
import artificierIcon from './classes/icon/artificier.png'
import barbarianIcon from './classes/icon/barbarian.png'
import bardIcon from './classes/icon/bard.png'
import bloodHunterIcon from './classes/icon/bloodHunter.png'
import clericIcon from './classes/icon/cleric.png'
import druidIcon from './classes/icon/druid.png'
import fighterIcon from './classes/icon/fighter.png'
import monkIcon from './classes/icon/monk.png'
import paladinIcon from './classes/icon/paladin.png'
import rogueIcon from './classes/icon/rogue.png'
import sorcererIcon from './classes/icon/sorcerer.png'
import warlockIcon from './classes/icon/warlock.png'
import wizardIcon from './classes/icon/wizard.png'

import alchemistInsignia from './classes/insignia/alchemist.svg'
import archerInsignia from './classes/insignia/archer.svg'
import artificierInsignia from './classes/insignia/artificier.svg'
import barbarianInsignia from './classes/insignia/barbarian.svg'
import bardInsignia from './classes/insignia/bard.svg'
import bloodHunterInsignia from './classes/insignia/bloodHunter.svg'
import clericInsignia from './classes/insignia/cleric.svg'
import druidInsignia from './classes/insignia/druid.svg'
import fighterInsignia from './classes/insignia/fighter.svg'
import monkInsignia from './classes/insignia/monk.svg'
import paladinInsignia from './classes/insignia/paladin.svg'
import rogueInsignia from './classes/insignia/rogue.svg'
import sorcererInsignia from './classes/insignia/sorcerer.svg'
import warlockInsignia from './classes/insignia/warlock.svg'
import wizardInsignia from './classes/insignia/wizard.svg'

import armorIcon from './system/armor.png'
import charismaIcon from './system/charisma.png'
import constitutionIcon from './system/constitution.png'
import dexterityIcon from './system/dexterity.png'
import initiativeIcon from './system/initiative.png'
import intelligenceIcon from './system/intelligence.png'
import settingsIcon from './system/settings.png'
import speedIcon from './system/speed.png'
import strengthIcon from './system/strength.png'
import warningIcon from './system/warning.png'
import wisdomIcon from './system/wisdom.png'

export function getIconIdSuffix(id: string): string {
  return id.split(':').at(-1) ?? id
}

const RACE_ICON_ASSETS: Record<string, string> = {
  aasimar: aasimarRace,
  dragonborn: dragonbornRace,
  dwarf: dwarfRace,
  elf: elfRace,
  gnome: gnomeRace,
  goliath: goliathRace,
  half_elf: halfElfRace,
  half_orc: halfOrcRace,
  halfling: halflingRace,
  human: humanRace,
  orc: orcRace,
  tiefling: tieflingRace,
}

/** Maps alternate / punctuated suffixes onto asset keys that match filenames. */
const RACE_ICON_ALIASES: Record<string, string> = {
  'half-elf': 'half_elf',
  halfelf: 'half_elf',
  'half-orc': 'half_orc',
  halforc: 'half_orc',
}

const CLASS_ICON_ASSETS: Record<string, string> = {
  alchemist: alchemistIcon,
  archer: archerIcon,
  artificier: artificierIcon,
  barbarian: barbarianIcon,
  bard: bardIcon,
  bloodHunter: bloodHunterIcon,
  cleric: clericIcon,
  druid: druidIcon,
  fighter: fighterIcon,
  monk: monkIcon,
  paladin: paladinIcon,
  rogue: rogueIcon,
  sorcerer: sorcererIcon,
  warlock: warlockIcon,
  wizard: wizardIcon,
}

const CLASS_ICON_ALIASES: Record<string, string> = {
  artificer: 'artificier',
  'blood-hunter': 'bloodHunter',
  hunter: 'archer',
  ranger: 'archer',
}

const CLASS_INSIGNIA_ASSETS: Record<string, string> = {
  alchemist: alchemistInsignia,
  archer: archerInsignia,
  artificier: artificierInsignia,
  barbarian: barbarianInsignia,
  bard: bardInsignia,
  bloodHunter: bloodHunterInsignia,
  cleric: clericInsignia,
  druid: druidInsignia,
  fighter: fighterInsignia,
  monk: monkInsignia,
  paladin: paladinInsignia,
  rogue: rogueInsignia,
  sorcerer: sorcererInsignia,
  warlock: warlockInsignia,
  wizard: wizardInsignia,
}

const CLASS_INSIGNIA_ALIASES: Record<string, string> = {
  artificer: 'artificier',
  'blood-hunter': 'bloodHunter',
  hunter: 'archer',
  ranger: 'archer',
}

export type SystemIconName =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma'
  | 'armor'
  | 'initiative'
  | 'speed'
  | 'settings'
  | 'warning'

/** System icons ship as PNG assets named `<name>.png`. */
export type SystemIconSize = 50

const SYSTEM_ICON_ASSETS: Record<SystemIconName, string> = {
  strength: strengthIcon,
  dexterity: dexterityIcon,
  constitution: constitutionIcon,
  intelligence: intelligenceIcon,
  wisdom: wisdomIcon,
  charisma: charismaIcon,
  armor: armorIcon,
  initiative: initiativeIcon,
  speed: speedIcon,
  settings: settingsIcon,
  warning: warningIcon,
}

/** Aliases for play terms that share a system asset (e.g. Hit Points → constitution). */
const SYSTEM_ICON_ALIASES: Record<string, SystemIconName> = {
  'armor-class': 'armor',
  armorClass: 'armor',
  ac: 'armor',
  'hit-points': 'constitution',
  hitPoints: 'constitution',
  hp: 'constitution',
  incomplete: 'warning',
}

function resolveAsset(
  id: string,
  assets: Record<string, string>,
  aliases: Record<string, string>,
): string | null {
  const suffix = getIconIdSuffix(id)
  const key = aliases[suffix] ?? suffix
  return assets[key] ?? null
}

/** Race / species selection artwork for an SRD (or homebrew) species id. */
export function getRaceIcon(speciesId: string): string | null {
  return resolveAsset(speciesId, RACE_ICON_ASSETS, RACE_ICON_ALIASES)
}

/** Compact class glyph for headers, summaries, pills, review, and navigation. */
export function getClassIcon(classId: string): string | null {
  return resolveAsset(classId, CLASS_ICON_ASSETS, CLASS_ICON_ALIASES)
}

/** Larger class crest for primary class selection cards. */
export function getClassInsignia(classId: string): string | null {
  return resolveAsset(classId, CLASS_INSIGNIA_ASSETS, CLASS_INSIGNIA_ALIASES)
}

/**
 * System UI artwork (ability scores, combat, settings, warnings).
 * Assets live at `src/assets/system/<name>.png`.
 */
export function getSystemIcon(
  name: string,
  _size: SystemIconSize = 50,
): string | null {
  const resolved = SYSTEM_ICON_ALIASES[name] ?? name
  return SYSTEM_ICON_ASSETS[resolved as SystemIconName] ?? null
}
