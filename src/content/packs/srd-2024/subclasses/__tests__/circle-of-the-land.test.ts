import { describe, expect, it } from 'vitest'
import { circleOfTheLandSrd2024 } from '../circle-of-the-land'

describe('circleOfTheLandSrd2024', () => {
  it('uses stable ids linked to Druid', () => {
    expect(circleOfTheLandSrd2024.id).toBe('srd-2024:circle-of-the-land')
    expect(circleOfTheLandSrd2024.classId).toBe('srd-2024:druid')
    expect(circleOfTheLandSrd2024.choiceOptionId).toBe('circle-of-the-land')
  })

  it('grants features at Circle of the Land levels', () => {
    expect(
      circleOfTheLandSrd2024.features.map((feature) => ({
        id: feature.id,
        level: feature.level,
      })),
    ).toEqual([
      { id: 'lands-aid', level: 3 },
      { id: 'natural-recovery', level: 6 },
      { id: 'natures-ward', level: 10 },
      { id: 'natures-sanctuary', level: 14 },
    ])
  })
})
