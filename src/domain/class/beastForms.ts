import type { ClassChoice, ClassChoiceOption } from './types'

/** Challenge Rating tiers used by Wild Shape Known Forms. */
export type BeastFormCr = '1/4' | '1/2' | '1'

export type BeastFormOption = {
  id: string
  label: string
  cr: BeastFormCr
  hasFly: boolean
}

const CR_RANK: Record<BeastFormCr, number> = {
  '1/4': 0.25,
  '1/2': 0.5,
  '1': 1,
}

/**
 * Curated SRD-friendly Beast forms for Wild Shape Known Forms.
 * Not a full bestiary — creator-time selection only (no transformation).
 */
export const CURATED_BEAST_FORMS: readonly BeastFormOption[] = [
  // CR 1/4, no fly
  { id: 'rat', label: 'Rat (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'cat', label: 'Cat (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'spider', label: 'Spider (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'wolf', label: 'Wolf (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'riding-horse', label: 'Riding Horse (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'mastiff', label: 'Mastiff (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'deer', label: 'Deer (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'goat', label: 'Goat (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'poisonous-snake', label: 'Poisonous Snake (CR 1/4)', cr: '1/4', hasFly: false },
  { id: 'constrictor-snake', label: 'Constrictor Snake (CR 1/4)', cr: '1/4', hasFly: false },
  // CR 1/4, fly (L8+)
  { id: 'owl', label: 'Owl (CR 1/4, Fly)', cr: '1/4', hasFly: true },
  { id: 'hawk', label: 'Hawk (CR 1/4, Fly)', cr: '1/4', hasFly: true },
  { id: 'raven', label: 'Raven (CR 1/4, Fly)', cr: '1/4', hasFly: true },
  // CR 1/2, no fly
  { id: 'crocodile', label: 'Crocodile (CR 1/2)', cr: '1/2', hasFly: false },
  { id: 'reef-shark', label: 'Reef Shark (CR 1/2)', cr: '1/2', hasFly: false },
  { id: 'warhorse', label: 'Warhorse (CR 1/2)', cr: '1/2', hasFly: false },
  { id: 'ape', label: 'Ape (CR 1/2)', cr: '1/2', hasFly: false },
  { id: 'black-bear', label: 'Black Bear (CR 1/2)', cr: '1/2', hasFly: false },
  { id: 'giant-goat', label: 'Giant Goat (CR 1/2)', cr: '1/2', hasFly: false },
  // CR 1/2, fly (L8+)
  { id: 'giant-bat', label: 'Giant Bat (CR 1/2, Fly)', cr: '1/2', hasFly: true },
  // CR 1, no fly
  { id: 'brown-bear', label: 'Brown Bear (CR 1)', cr: '1', hasFly: false },
  { id: 'dire-wolf', label: 'Dire Wolf (CR 1)', cr: '1', hasFly: false },
  { id: 'lion', label: 'Lion (CR 1)', cr: '1', hasFly: false },
  { id: 'tiger', label: 'Tiger (CR 1)', cr: '1', hasFly: false },
  { id: 'giant-toad', label: 'Giant Toad (CR 1)', cr: '1', hasFly: false },
  { id: 'giant-spider', label: 'Giant Spider (CR 1)', cr: '1', hasFly: false },
  // CR 1, fly (L8+)
  { id: 'giant-eagle', label: 'Giant Eagle (CR 1, Fly)', cr: '1', hasFly: true },
  { id: 'giant-owl', label: 'Giant Owl (CR 1, Fly)', cr: '1', hasFly: true },
]

export const WILD_SHAPE_FORMS_CHOICE_ID = 'wild-shape-forms'

/** Known Forms count by Druid level (0 before L2). */
export function getWildShapeKnownFormsCount(level: number): number {
  if (level < 2) {
    return 0
  }
  if (level < 4) {
    return 4
  }
  if (level < 8) {
    return 6
  }
  return 8
}

/** Max CR allowed for Known Forms at the given class level. */
export function getWildShapeMaxCr(level: number): BeastFormCr | null {
  if (level < 2) {
    return null
  }
  if (level < 4) {
    return '1/4'
  }
  if (level < 8) {
    return '1/2'
  }
  return '1'
}

export function canWildShapeUseFlySpeed(level: number): boolean {
  return level >= 8
}

export function isBeastFormEligibleAtLevel(
  form: BeastFormOption,
  level: number,
): boolean {
  const maxCr = getWildShapeMaxCr(level)
  if (maxCr === null) {
    return false
  }
  if (CR_RANK[form.cr] > CR_RANK[maxCr]) {
    return false
  }
  if (form.hasFly && !canWildShapeUseFlySpeed(level)) {
    return false
  }
  return true
}

export function getEligibleBeastForms(level: number): BeastFormOption[] {
  return CURATED_BEAST_FORMS.filter((form) =>
    isBeastFormEligibleAtLevel(form, level),
  )
}

export function beastFormsToChoiceOptions(
  forms: readonly BeastFormOption[],
): ClassChoiceOption[] {
  return forms.map((form) => ({
    id: form.id,
    label: form.label,
  }))
}

/** Adjust Wild Shape Known Forms min/max and eligible options by class level. */
export function withWildShapeFormsChoiceLimits(
  choice: ClassChoice,
  level: number,
): ClassChoice {
  if (choice.id !== WILD_SHAPE_FORMS_CHOICE_ID || choice.type !== 'multi-select') {
    return choice
  }

  const knownForms = getWildShapeKnownFormsCount(level)
  if (knownForms === 0) {
    return choice
  }

  return {
    ...choice,
    min: knownForms,
    max: knownForms,
    options: beastFormsToChoiceOptions(getEligibleBeastForms(level)),
  }
}
