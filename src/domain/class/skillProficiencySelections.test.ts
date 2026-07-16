import { describe, expect, it } from 'vitest'
import { barbarianSrd2024 } from '../../content/packs/srd-2024/classes/barbarian'
import { collectSkillProficiencySelections } from './skillProficiencySelections'

describe('collectSkillProficiencySelections', () => {
  it('collects skills across Barbarian skill choices', () => {
    expect(
      collectSkillProficiencySelections(barbarianSrd2024, {
        'skill-proficiencies': ['athletics', 'perception'],
        'primal-knowledge': ['intimidation'],
      }),
    ).toEqual(['athletics', 'perception', 'intimidation'])
  })

  it('can exclude one skill choice when collecting', () => {
    expect(
      collectSkillProficiencySelections(
        barbarianSrd2024,
        {
          'skill-proficiencies': ['athletics', 'perception'],
          'primal-knowledge': ['intimidation'],
        },
        'primal-knowledge',
      ),
    ).toEqual(['athletics', 'perception'])
  })
})
