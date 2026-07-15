import type { FeatValidationIssue } from '../../rules/feat/featRules'

const MESSAGE_BY_CODE: Record<
  FeatValidationIssue['code'],
  (issue: FeatValidationIssue) => string
> = {
  'feat-not-found': () => 'The selected feat could not be found.',
  'wrong-edition': () =>
    'The selected feat is not available for the current rules edition.',
  'missing-required-choice': (issue) =>
    `Choose an option for ${issue.choiceId ?? 'a required feat choice'}.`,
  'invalid-choice': (issue) =>
    `The selected option for ${issue.choiceId ?? 'a feat choice'} is invalid.`,
  'unknown-choice': (issue) =>
    `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`,
}

export function formatFeatValidationIssue(issue: FeatValidationIssue): string {
  return MESSAGE_BY_CODE[issue.code](issue)
}
