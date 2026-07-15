export const CHARACTER_DETAILS_AGE_INPUT_ID = 'character-details-age'
export const CHARACTER_DETAILS_AGE_GUIDANCE_ID =
  'character-details-age-species-guidance'
export const CHARACTER_DETAILS_HEIGHT_INPUT_ID = 'character-details-height'
export const CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID =
  'character-details-height-species-guidance'

export function combineDescribedBy(
  ...ids: Array<string | null | undefined | false>
): string | undefined {
  const validIds = ids.filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  )

  return validIds.length > 0 ? validIds.join(' ') : undefined
}

export function hasSpeciesGuidanceText(
  value: string | undefined,
): value is string {
  return value !== undefined && value.length > 0
}
