import artificerIcon from '../../assets/classes/Artificer.png'
import fighterIcon from '../../assets/classes/Fighter.png'
import rogueIcon from '../../assets/classes/Rogue.png'
import barbarianIcon from '../../assets/classes/Barbarian.png'

/**
 * PNG class icons keyed by the stable ID suffix (the part after `:`).
 * To add an icon: place `src/assets/classes/<Name>.png` and add one entry here.
 */
export const CLASS_ICON_ASSETS: Record<string, string> = {
  artificer: artificerIcon,
  fighter: fighterIcon,
  rogue: rogueIcon,
  barbarian: barbarianIcon,
}

export function getClassIconSuffix(classId: string): string {
  return classId.split(':').at(-1) ?? classId
}

export function getClassIconAsset(classId: string): string | null {
  return CLASS_ICON_ASSETS[getClassIconSuffix(classId)] ?? null
}
