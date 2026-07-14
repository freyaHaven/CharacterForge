export function getChoiceAccordionTitle(prompt: string): string {
  return prompt.replace(/^Choose (?:a |an |the |two )?/i, '').replace(/\.$/, '')
}
