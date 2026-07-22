import type { ClassValidationIssue } from '../../rules/class/classRules'
import { isAbilityScoreImprovementChoiceId } from '../../domain/class/abilityScoreImprovement'
import { isEpicBoonChoiceId } from '../../domain/class/epicBoon'

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
      : issue.choiceId === 'champion-additional-fighting-style'
        ? 'Choose an Additional Fighting Style.'
      : issue.choiceId === 'skill-proficiencies'
        ? 'Choose two skill proficiencies.'
        : issue.choiceId?.startsWith('weapon-mastery')
          ? 'Choose your Weapon Masteries.'
          : isAbilityScoreImprovementChoiceId(issue.choiceId ?? '')
            ? 'Complete your Ability Score Improvement.'
            : isEpicBoonChoiceId(issue.choiceId ?? '')
              ? 'Choose an Epic Boon or qualifying feat.'
              : `Choose an option for ${issue.choiceId ?? 'a required class choice'}.`,
  'invalid-choice': (issue) =>
    isAbilityScoreImprovementChoiceId(issue.choiceId ?? '')
      ? 'The Ability Score Improvement selection is invalid.'
      : isEpicBoonChoiceId(issue.choiceId ?? '')
        ? 'The Epic Boon selection is invalid.'
        : `The selected option for ${issue.choiceId ?? 'a class choice'} is invalid.`,
  'invalid-multi-select-count': (issue) =>
    issue.choiceId === 'skill-proficiencies'
      ? 'Choose exactly two skill proficiencies.'
      : issue.choiceId?.startsWith('weapon-mastery')
        ? 'Choose the required number of Weapon Masteries.'
        : `Choose the required number of options for ${issue.choiceId ?? 'a class choice'}.`,
  'unknown-choice': (issue) =>
    `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`,
  'duplicate-instance-id': () => 'Each class instance must have a unique instance id.',
  'duplicate-class-id': () => 'Each class may only be selected once.',
  'allocation-exceeds-target': () =>
    'Allocated class levels exceed the target character level.',
  'invalid-starting-class-reference': () =>
    'The starting class reference is invalid.',
  'multiclass-ability-prerequisite': () =>
    'Multiclass ability score prerequisites are not met. Raise the required scores on the Abilities step or adjust your class mix.',
}

export function formatClassValidationIssue(
  issue: ClassValidationIssue,
): string {
  return MESSAGE_BY_CODE[issue.code](issue)
}
