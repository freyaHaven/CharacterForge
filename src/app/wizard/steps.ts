import type { WizardStepDefinition, WizardUiState } from './types'

export const WIZARD_STEPS: readonly WizardStepDefinition[] = [
  { id: 'basics', label: 'Basics', required: true },
  { id: 'species', label: 'Species', required: true },
  { id: 'class', label: 'Class', required: false },
  { id: 'ability-scores', label: 'Ability Scores', required: true },
  { id: 'background', label: 'Background', required: false },
  { id: 'equipment', label: 'Equipment', required: false },
  { id: 'review', label: 'Review', required: false },
] as const

export const DEFAULT_WIZARD_UI_STATE: WizardUiState = {
  activeStepId: 'basics',
}
