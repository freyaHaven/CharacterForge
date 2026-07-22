import type {
  ClassDefinition,
  ClassSelection,
  ResolvedClassEffect,
} from '../../domain/class/types'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeaturesUpToLevel } from '../../domain/class/featureProgression'

export function resolveClassEffects(
  definition: ClassDefinition,
  selection: ClassSelection,
): ResolvedClassEffect[] {
  const effects: ResolvedClassEffect[] = [
    { kind: 'hit-die', sides: definition.hitDie.sides },
    ...definition.savingThrows.map((ability) => ({
      kind: 'saving-throw-proficiency' as const,
      ability,
    })),
    ...definition.proficiencies.armor.map((category) => ({
      kind: 'armor-proficiency' as const,
      category,
    })),
    ...definition.proficiencies.weapons.map((category) => ({
      kind: 'weapon-proficiency' as const,
      category,
    })),
  ]

  if (definition.spellcasting !== undefined) {
    effects.push({
      kind: 'spellcasting',
      ability: definition.spellcasting.ability,
    })
  }

  for (const feature of getClassFeaturesUpToLevel(
    definition,
    selection.level,
  )) {
    if (feature.effects !== undefined) {
      effects.push(...feature.effects)
    }
  }

  for (const choice of getChoicesAvailableAtLevel(
    definition,
    selection.level,
    selection.choices,
  )) {
    const value = selection.choices[choice.id]

    if (value === undefined) {
      continue
    }

    const selectedOptionIds =
      typeof value === 'string' ? [value] : [...value]

    for (const optionId of selectedOptionIds) {
      const option = choice.options.find((candidate) => candidate.id === optionId)

      if (option?.effects !== undefined) {
        effects.push(...option.effects)
      }

      for (const feature of option?.features ?? []) {
        if (feature.level > selection.level) {
          continue
        }
        if (feature.effects !== undefined) {
          effects.push(...feature.effects)
        }
      }
    }
  }

  return dedupeArmorAndWeaponCategories(effects)
}

/** Keep first occurrence of each armor/weapon proficiency category. */
function dedupeArmorAndWeaponCategories(
  effects: ResolvedClassEffect[],
): ResolvedClassEffect[] {
  const seenArmor = new Set<string>()
  const seenWeapons = new Set<string>()
  const result: ResolvedClassEffect[] = []

  for (const effect of effects) {
    if (effect.kind === 'armor-proficiency') {
      if (seenArmor.has(effect.category)) {
        continue
      }
      seenArmor.add(effect.category)
    }

    if (effect.kind === 'weapon-proficiency') {
      if (seenWeapons.has(effect.category)) {
        continue
      }
      seenWeapons.add(effect.category)
    }

    if (effect.kind === 'weapon-proficiency-item') {
      if (seenWeapons.has(`item:${effect.weaponId}`)) {
        continue
      }
      seenWeapons.add(`item:${effect.weaponId}`)
    }

    result.push(effect)
  }

  return result
}
