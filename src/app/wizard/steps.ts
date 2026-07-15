import type { WizardStepDefinition, WizardUiState } from './types'

export const WIZARD_STEPS: readonly WizardStepDefinition[] = [
  { id: 'basics', label: 'Basics', required: true },
  { id: 'species', label: 'Species', required: true },
  {
    id: 'character-details',
    label: 'Character Details',
    required: false,
  },
  { id: 'ability-scores', label: 'Ability Scores', required: true },
  { id: 'class', label: 'Class', required: true },
  { id: 'background', label: 'Background', required: false },
  { id: 'equipment', label: 'Equipment', required: false },
  {
    id: 'feats',
    label: 'Feats',
    required: false,
  },
  {
    id: 'spells',
    label: 'Spells',
    required: false,
    visibility: { kind: 'conditional', when: 'spells' },
  },
  { id: 'review', label: 'Review', required: false },
] as const

export const DEFAULT_WIZARD_UI_STATE: WizardUiState = {
  activeStepId: 'basics',
}
