import type { AlignmentId } from './alignment'
import { isAlignmentId } from './alignment'
import type { CharacterDetails } from './details'
import { createDefaultCharacterDetails } from './details'
import type { GenderId } from './gender'
import { isGenderId } from './gender'
import type { PronounId } from './pronouns'
import { isPronounId } from './pronouns'

/**
 * Legacy character details persisted under schema v7.
 */
export type LegacyCharacterDetailsV7 = {
  age: string
  gender: string
  pronouns: string
  alignment: AlignmentId | null
  height: string
  weight: string
  eyes: string
  hair: string
  skin: string
  appearance: string
  notes: string
}

function appendPreservedNote(existing: string, note: string): string {
  const trimmedNote = note.trim()
  if (trimmedNote.length === 0) {
    return existing
  }

  const trimmedExisting = existing.trim()
  if (trimmedExisting.length === 0) {
    return trimmedNote
  }

  return `${trimmedExisting}\n\n${trimmedNote}`
}

function normalizeGender(value: string): GenderId | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (isGenderId(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase()

  if (['female', 'woman', 'f'].includes(normalized)) {
    return 'female'
  }

  if (['male', 'man', 'm'].includes(normalized)) {
    return 'male'
  }

  if (
    ['non-binary', 'nonbinary', 'non binary', 'enby', 'nb'].includes(normalized)
  ) {
    return 'non-binary'
  }

  return null
}

function normalizePronouns(value: string): PronounId | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (isPronounId(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ')

  if (['he/him', 'he him'].includes(normalized)) {
    return 'he-him'
  }

  if (['she/her', 'she her'].includes(normalized)) {
    return 'she-her'
  }

  if (['they/them', 'they them'].includes(normalized)) {
    return 'they-them'
  }

  return null
}

function readMigratedDetails(
  candidate: Record<string, unknown>,
): CharacterDetails {
  return {
    age: typeof candidate.age === 'string' ? candidate.age : '',
    height: typeof candidate.height === 'string' ? candidate.height : '',
    weight: typeof candidate.weight === 'string' ? candidate.weight : '',
    gender: isGenderId(candidate.gender) ? candidate.gender : null,
    pronouns: isPronounId(candidate.pronouns) ? candidate.pronouns : null,
    eyeColour:
      typeof candidate.eyeColour === 'string' ? candidate.eyeColour : '',
    hairColour:
      typeof candidate.hairColour === 'string' ? candidate.hairColour : '',
    skinTone: typeof candidate.skinTone === 'string' ? candidate.skinTone : '',
    alignment:
      candidate.alignment === null || isAlignmentId(candidate.alignment)
        ? candidate.alignment
        : null,
    personalityTraits:
      typeof candidate.personalityTraits === 'string'
        ? candidate.personalityTraits
        : '',
    ideals: typeof candidate.ideals === 'string' ? candidate.ideals : '',
    bonds: typeof candidate.bonds === 'string' ? candidate.bonds : '',
    flaws: typeof candidate.flaws === 'string' ? candidate.flaws : '',
    backstoryNotes:
      typeof candidate.backstoryNotes === 'string'
        ? candidate.backstoryNotes
        : '',
  }
}

function isLegacyCharacterDetailsV7(
  candidate: Record<string, unknown>,
): candidate is LegacyCharacterDetailsV7 {
  return 'eyes' in candidate || 'notes' in candidate || 'appearance' in candidate
}

function isMigratedCharacterDetailsV8(candidate: Record<string, unknown>): boolean {
  return 'eyeColour' in candidate || 'backstoryNotes' in candidate
}

/**
 * Migrates schema v7 character details to the v8 roleplay-focused shape.
 *
 * Field mapping:
 * - eyes → eyeColour
 * - hair → hairColour
 * - skin → skinTone
 * - notes → backstoryNotes
 *
 * Preserved free-text values:
 * - Unmatched gender/pronoun values are appended to backstoryNotes as
 *   "Gender (previous): …" / "Pronouns (previous): …" rather than discarded.
 * - Non-empty appearance text is appended as "Appearance (previous): …".
 */
export function migrateLegacyCharacterDetails(
  value: unknown,
): CharacterDetails {
  if (typeof value !== 'object' || value === null) {
    return createDefaultCharacterDetails()
  }

  const candidate = value as Record<string, unknown>

  if (isMigratedCharacterDetailsV8(candidate)) {
    return readMigratedDetails(candidate)
  }

  if (!isLegacyCharacterDetailsV7(candidate)) {
    return createDefaultCharacterDetails()
  }

  const legacy = candidate
  let backstoryNotes = legacy.notes ?? ''

  if (typeof legacy.appearance === 'string' && legacy.appearance.trim().length > 0) {
    backstoryNotes = appendPreservedNote(
      backstoryNotes,
      `Appearance (previous): ${legacy.appearance.trim()}`,
    )
  }

  const gender = normalizeGender(legacy.gender ?? '')
  if (typeof legacy.gender === 'string' && legacy.gender.trim().length > 0 && gender === null) {
    backstoryNotes = appendPreservedNote(
      backstoryNotes,
      `Gender (previous): ${legacy.gender.trim()}`,
    )
  }

  const pronouns = normalizePronouns(legacy.pronouns ?? '')
  if (
    typeof legacy.pronouns === 'string' &&
    legacy.pronouns.trim().length > 0 &&
    pronouns === null
  ) {
    backstoryNotes = appendPreservedNote(
      backstoryNotes,
      `Pronouns (previous): ${legacy.pronouns.trim()}`,
    )
  }

  return {
    age: legacy.age ?? '',
    height: legacy.height ?? '',
    weight: legacy.weight ?? '',
    gender,
    pronouns,
    eyeColour: legacy.eyes ?? '',
    hairColour: legacy.hair ?? '',
    skinTone: legacy.skin ?? '',
    alignment: legacy.alignment ?? null,
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstoryNotes,
  }
}
