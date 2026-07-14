import type { ClassValidationIssue } from '../../rules/class/classRules'

const MESSAGE_BY_CODE: Record<
  ClassValidationIssue['code'],
  (issue: ClassValidationIssue) => string
> = {
  'class-not-found': () => 'The selected class could not be found.',
  'wrong-edition': () =>
    'The selected class is not available for the current rules edition.',
  'invalid-level': () => 'Choose a valid class level between 1 and 20.',
  'missing-required-choice': (issue) =>
    issue.choiceId === 'fighting-style'
      ? 'Choose a Fighting Style.'
      : issue.choiceId === 'skill-proficiencies'
        ? 'Choose two skill proficiencies.'
        : `Choose an option for ${issue.choiceId ?? 'a required class choice'}.`,
  'invalid-choice': (issue) =>
    `The selected option for ${issue.choiceId ?? 'a class choice'} is invalid.`,
  'invalid-multi-select-count': (issue) =>
    issue.choiceId === 'skill-proficiencies'
      ? 'Choose exactly two skill proficiencies.'
      : `Choose the required number of options for ${issue.choiceId ?? 'a class choice'}.`,
  'unknown-choice': (issue) =>
    `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`,
}

export function formatClassValidationIssue(
  issue: ClassValidationIssue,
): string {
  return MESSAGE_BY_CODE[issue.code](issue)
}
