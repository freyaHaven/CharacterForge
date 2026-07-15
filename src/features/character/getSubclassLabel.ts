import type {
  ClassChoiceValue,
  ClassDefinition,
} from '../../domain/class/types'

export function getSubclassLabelFromDefinition(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
): string | null {
  const subclassChoice = definition.choices.find(
    (choice) =>
      choice.id.endsWith('-subclass') && choice.type === 'single-select',
  )

  if (subclassChoice?.type !== 'single-select') {
    return null
  }

  const selectedValue = choices[subclassChoice.id]

  if (typeof selectedValue !== 'string') {
    return null
  }

  return (
    subclassChoice.options.find((option) => option.id === selectedValue)
      ?.label ?? null
  )
}
