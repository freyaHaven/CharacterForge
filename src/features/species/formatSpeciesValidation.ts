import type { SpeciesValidationIssue } from '../../rules/species/speciesRules'

const MESSAGE_BY_CODE: Record<
  SpeciesValidationIssue['code'],
  (issue: SpeciesValidationIssue) => string
> = {
  'species-not-found': () => 'The selected species could not be found.',
  'wrong-edition': () =>
    'The selected species is not available for the current rules edition.',
  'missing-required-choice': (issue) => {
    if (issue.choiceId === 'draconic-ancestry') {
      return 'Choose a draconic ancestor.'
    }

    if (issue.choiceId === 'standard-languages') {
      return 'Choose 2 languages from the Standard Languages table.'
    }

    if (issue.choiceId === 'skillful') {
      return 'Choose a skill for Skillful.'
    }

    if (issue.choiceId === 'versatile') {
      return 'Choose an Origin feat for Versatile.'
    }

    if (issue.choiceId === 'keen-senses') {
      return 'Choose a skill for Keen Senses.'
    }

    if (issue.choiceId === 'size') {
      return 'Choose your size.'
    }

    return `Choose an option for ${issue.choiceId ?? 'a required species choice'}.`
  },
  'invalid-choice': (issue) =>
    `The selected option for ${issue.choiceId ?? 'a species choice'} is invalid.`,
  'unknown-choice': (issue) =>
    `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`,
  'duplicate-feat': (issue) =>
    `The feat chosen for ${issue.choiceId ?? 'this species choice'} is already granted.`,
}

export function formatSpeciesValidationIssue(
  issue: SpeciesValidationIssue,
): string {
  return MESSAGE_BY_CODE[issue.code](issue)
}
