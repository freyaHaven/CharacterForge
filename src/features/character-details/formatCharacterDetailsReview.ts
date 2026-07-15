import { getAlignmentLabel } from '../../domain/character/alignment'
import type { CharacterDetails } from '../../domain/character/details'
import { getGenderLabel } from '../../domain/character/gender'
import { getPronounLabel } from '../../domain/character/pronouns'

export type CharacterDetailsReviewSections = {
  identity: string[]
  personality: string[]
  backstoryNotes: string | null
}

export function hasCharacterDetailsReviewContent(
  sections: CharacterDetailsReviewSections,
): boolean {
  return (
    sections.identity.length > 0 ||
    sections.personality.length > 0 ||
    (sections.backstoryNotes?.trim().length ?? 0) > 0
  )
}

export function formatCharacterDetailsReviewSections(
  details: CharacterDetails,
): CharacterDetailsReviewSections {
  const identity: string[] = []

  if (details.age.trim().length > 0) {
    identity.push(`Age: ${details.age.trim()}`)
  }

  if (details.height.trim().length > 0) {
    identity.push(`Height: ${details.height.trim()}`)
  }

  if (details.weight.trim().length > 0) {
    identity.push(`Weight: ${details.weight.trim()}`)
  }

  if (details.gender !== null) {
    identity.push(`Gender: ${getGenderLabel(details.gender)}`)
  }

  if (details.pronouns !== null) {
    identity.push(`Pronouns: ${getPronounLabel(details.pronouns)}`)
  }

  if (details.eyeColour.trim().length > 0) {
    identity.push(`Eye Colour: ${details.eyeColour.trim()}`)
  }

  if (details.hairColour.trim().length > 0) {
    identity.push(`Hair Colour: ${details.hairColour.trim()}`)
  }

  if (details.skinTone.trim().length > 0) {
    identity.push(`Skin Tone: ${details.skinTone.trim()}`)
  }

  const personality: string[] = []

  if (details.alignment !== null) {
    personality.push(`Alignment: ${getAlignmentLabel(details.alignment)}`)
  }

  if (details.personalityTraits.trim().length > 0) {
    personality.push(`Personality Traits: ${details.personalityTraits.trim()}`)
  }

  if (details.ideals.trim().length > 0) {
    personality.push(`Ideals: ${details.ideals.trim()}`)
  }

  if (details.bonds.trim().length > 0) {
    personality.push(`Bonds: ${details.bonds.trim()}`)
  }

  if (details.flaws.trim().length > 0) {
    personality.push(`Flaws: ${details.flaws.trim()}`)
  }

  const backstoryNotes =
    details.backstoryNotes.trim().length > 0
      ? details.backstoryNotes.trim()
      : null

  return {
    identity,
    personality,
    backstoryNotes,
  }
}

/** @deprecated Use formatCharacterDetailsReviewSections for sectioned review output. */
export function formatCharacterDetailsReviewLines(
  details: CharacterDetails,
): string[] {
  const sections = formatCharacterDetailsReviewSections(details)
  const lines = [...sections.identity, ...sections.personality]

  if (sections.backstoryNotes !== null) {
    lines.push(`Backstory & Notes: ${sections.backstoryNotes}`)
  }

  return lines
}
