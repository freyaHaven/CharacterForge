import type { AlignmentId } from './alignment'
import { isAlignmentId } from './alignment'
import type { GenderId } from './gender'
import { isGenderId } from './gender'
import type { PronounId } from './pronouns'
import { isPronounId } from './pronouns'

export type CharacterDetails = {
  age: string
  height: string
  weight: string
  gender: GenderId | null
  pronouns: PronounId | null
  eyeColour: string
  hairColour: string
  skinTone: string
  alignment: AlignmentId | null
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  backstoryNotes: string
}

export function createDefaultCharacterDetails(): CharacterDetails {
  return {
    age: '',
    height: '',
    weight: '',
    gender: null,
    pronouns: null,
    eyeColour: '',
    hairColour: '',
    skinTone: '',
    alignment: null,
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstoryNotes: '',
  }
}

export function isCharacterDetails(value: unknown): value is CharacterDetails {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.age === 'string' &&
    typeof candidate.height === 'string' &&
    typeof candidate.weight === 'string' &&
    (candidate.gender === null || isGenderId(candidate.gender)) &&
    (candidate.pronouns === null || isPronounId(candidate.pronouns)) &&
    typeof candidate.eyeColour === 'string' &&
    typeof candidate.hairColour === 'string' &&
    typeof candidate.skinTone === 'string' &&
    (candidate.alignment === null || isAlignmentId(candidate.alignment)) &&
    typeof candidate.personalityTraits === 'string' &&
    typeof candidate.ideals === 'string' &&
    typeof candidate.bonds === 'string' &&
    typeof candidate.flaws === 'string' &&
    typeof candidate.backstoryNotes === 'string'
  )
}

export function hasCharacterDetailsContent(details: CharacterDetails): boolean {
  return (
    details.age.trim().length > 0 ||
    details.height.trim().length > 0 ||
    details.weight.trim().length > 0 ||
    details.gender !== null ||
    details.pronouns !== null ||
    details.eyeColour.trim().length > 0 ||
    details.hairColour.trim().length > 0 ||
    details.skinTone.trim().length > 0 ||
    details.alignment !== null ||
    details.personalityTraits.trim().length > 0 ||
    details.ideals.trim().length > 0 ||
    details.bonds.trim().length > 0 ||
    details.flaws.trim().length > 0 ||
    details.backstoryNotes.trim().length > 0
  )
}
