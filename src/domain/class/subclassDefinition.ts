import type { ClassChoiceOption, SubclassDefinition } from './types'

/** Maps a content-pack subclass into the choice option shape used by ClassDefinition. */
export function subclassToChoiceOption(
  subclass: SubclassDefinition,
): ClassChoiceOption {
  return {
    id: subclass.choiceOptionId,
    label: subclass.name,
    description: subclass.description,
    features: subclass.features,
  }
}
