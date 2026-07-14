import { useState } from 'react'
import type { ChoiceAccordionOption } from './ChoiceAccordion'

export function useExpandableSingleSelectChoice({
  selectedOptionId,
  defaultExpanded,
  expanded: controlledExpanded,
  onExpandedChange,
  onSelect,
}: {
  selectedOptionId: string | null | undefined
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onSelect: (optionId: string) => void
}) {
  const hasSelection =
    selectedOptionId !== null &&
    selectedOptionId !== undefined &&
    selectedOptionId.length > 0

  const [internalExpanded, setInternalExpanded] = useState(
    () => defaultExpanded ?? !hasSelection,
  )

  const isControlled = controlledExpanded !== undefined
  const isExpanded = isControlled ? controlledExpanded : internalExpanded

  function setExpanded(nextExpanded: boolean) {
    if (isControlled) {
      onExpandedChange?.(nextExpanded)
      return
    }

    setInternalExpanded(nextExpanded)
  }

  function toggleExpanded() {
    setExpanded(!isExpanded)
  }

  function handleSelect(optionId: string) {
    onSelect(optionId)
    setExpanded(false)
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
