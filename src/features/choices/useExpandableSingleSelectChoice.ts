import { useState } from 'react'
import type { ChoiceAccordionOption } from './ChoiceAccordion'

export function useExpandableSingleSelectChoice({
  selectedOptionId,
  defaultExpanded,
  onSelect,
}: {
  selectedOptionId: string | null | undefined
  defaultExpanded?: boolean
  onSelect: (optionId: string) => void
}) {
  const hasSelection =
    selectedOptionId !== null &&
    selectedOptionId !== undefined &&
    selectedOptionId.length > 0

  const [isExpanded, setIsExpanded] = useState(
    () => defaultExpanded ?? !hasSelection,
  )

  function toggleExpanded() {
    setIsExpanded((current) => !current)
  }

  function handleSelect(optionId: string) {
    onSelect(optionId)
    setIsExpanded(false)
  }

  return {
    isExpanded,
    toggleExpanded,
    handleSelect,
    hasSelection,
  }
}

export function getSelectedOption(
  options: readonly ChoiceAccordionOption[],
  selectedOptionId: string | null | undefined,
): ChoiceAccordionOption | null {
  if (
    selectedOptionId === null ||
    selectedOptionId === undefined ||
    selectedOptionId.length === 0
  ) {
    return null
  }

  return options.find((option) => option.id === selectedOptionId) ?? null
}

export function getSelectedOptionLabel(
  options: readonly ChoiceAccordionOption[],
  selectedOptionId: string | null | undefined,
): string | null {
  return getSelectedOption(options, selectedOptionId)?.label ?? null
}
