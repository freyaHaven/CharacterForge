import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { Character } from '../../domain/types'
import { resolveClassEffects } from '../class/resolveClassEffects'

export type CharacterSpellcastingSummary = {
  hasSpellcastingCapability: boolean
  spellLines: string[]
}

export async function resolveCharacterSpellcasting(
  catalog: ClassCatalog,
  character: Character,
): Promise<CharacterSpellcastingSummary> {
  for (const instance of character.classes) {
    const definition = await catalog.getClass(instance.classId)

    if (definition === null) {
      continue
    }

    const effects = resolveClassEffects(definition, {
      classId: instance.classId,
      level: instance.level,
      choices: instance.choices,
    })

    if (effects.some((effect) => effect.kind === 'spellcasting')) {
      return {
        hasSpellcastingCapability: true,
        spellLines: [],
      }
    }
  }

  return {
    hasSpellcastingCapability: false,
    spellLines: [],
  }
}
