import type { BackgroundValidationIssue } from '../../rules/background/backgroundRules'

const CHOICE_MESSAGES: Record<string, string> = {
  'gaming-set': 'Choose a Gaming Set.',
  'starting-equipment': 'Choose starting equipment or take 50 GP.',
}

export function formatBackgroundValidationIssue(
  issue: BackgroundValidationIssue,
): string {
  switch (issue.code) {
    case 'background-not-found':
      return 'The selected background could not be found.'
    case 'wrong-edition':
      return 'The selected background is not available for this rules edition.'
    case 'missing-ability-score-increase':
      return 'Choose how to increase your background ability scores.'
    case 'invalid-ability-score-increase':
      return 'Choose valid ability score increases from your background options.'
    case 'missing-required-choice':
      return issue.choiceId !== undefined &&
        issue.choiceId in CHOICE_MESSAGES
        ? CHOICE_MESSAGES[issue.choiceId]
        : 'Complete all required background choices.'
    case 'invalid-choice':
      return issue.choiceId !== undefined &&
        issue.choiceId in CHOICE_MESSAGES
        ? CHOICE_MESSAGES[issue.choiceId]
        : 'One or more background choices are invalid.'
    case 'unknown-choice':
      return 'Remove invalid background choices.'
    default:
      return 'Complete the background selection.'
  }
}
