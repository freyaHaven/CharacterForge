import type { SpeciesValidationIssue } from '../../rules/species/speciesRules'

const MESSAGE_BY_CODE: Record<
  SpeciesValidationIssue['code'],
  (issue: SpeciesValidationIssue) => string
> = {
  'species-not-found': () => 'The selected species could not be found.',
  'wrong-edition': () =>
    'The selected species is not available for the current rules edition.',
  'missing-required-choice': (issue) =>
    issue.choiceId === 'draconic-ancestry'
      ? 'Choose a draconic ancestor.'
      : `Choose an option for ${issue.choiceId ?? 'a required species choice'}.`,
  'invalid-choice': (issue) =>
    `The selected option for ${issue.choiceId ?? 'a species choice'} is invalid.`,
  'unknown-choice': (issue) =>
    `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`,
}

export function formatSpeciesValidationIssue(
  issue: SpeciesValidationIssue,
): string {
  return MESSAGE_BY_CODE[issue.code](issue)
}
