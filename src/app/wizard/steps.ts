import type { WizardStepDefinition, WizardUiState } from './types'

export const WIZARD_STEPS: readonly WizardStepDefinition[] = [
  { id: 'basics', label: 'Basics', required: true },
  { id: 'class', label: 'Class', required: true },
  { id: 'background', label: 'Background', required: true },
  { id: 'species', label: 'Species', required: true },
  { id: 'ability-scores', label: 'Abilities', required: true },
  { id: 'equipment', label: 'Equipment', required: false },
  {
    id: 'feats',
    label: 'Feats',
    required: false,
    visibility: { kind: 'conditional', when: 'feats' },
  },
  {
    id: 'spells',
    label: 'Spells',
    required: false,
    visibility: { kind: 'conditional', when: 'spells' },
  },
  { id: 'review', label: 'Overview', required: false },
] as const

export const DEFAULT_WIZARD_UI_STATE: WizardUiState = {
  activeStepId: 'basics',
}
