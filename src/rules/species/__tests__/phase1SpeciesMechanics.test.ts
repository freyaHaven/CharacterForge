import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { elfSrd2024 } from '../../../content/packs/srd-2024/species/elf'
import { humanSrd2024 } from '../../../content/packs/srd-2024/species/human'
import { gnomeSrd2024 } from '../../../content/packs/srd-2024/species/gnome'
import {
  COMPLETE_HUMAN_SELECTION,
  COMPLETE_WOOD_ELF_SELECTION,
  PRE_PHASE1_HUMAN_SELECTION,
} from '../../../testing/speciesSelectionTestUtils'
import { resolveSpeciesEffects } from '../resolveSpeciesEffects'
import {
  resolveSpeciesSize,
  resolveSpeciesWalkSpeed,
} from '../resolveSpeciesDerivedStats'
import { validateSpeciesSelection } from '../speciesRules'

describe('Phase 1 species mechanics', () => {
  it('marks pre-Phase-1 Human saves incomplete without Skillful or Versatile', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const featById = new Map(feats.map((feat) => [feat.id, feat]))

    const result = validateSpeciesSelection(
      { ...PRE_PHASE1_HUMAN_SELECTION, choices: { ...PRE_PHASE1_HUMAN_SELECTION.choices } },
      'srd-2024',
      humanSrd2024,
      { featById },
    )

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.issues.map((issue) => issue.choiceId).sort()).toEqual([
      'skillful',
      'versatile',
    ])
  })

  it('accepts a complete Human with Skillful and Versatile', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const featById = new Map(feats.map((feat) => [feat.id, feat]))

    expect(
      validateSpeciesSelection(
        {
          ...COMPLETE_HUMAN_SELECTION,
          choices: { ...COMPLETE_HUMAN_SELECTION.choices },
        },
        'srd-2024',
        humanSrd2024,
        { featById },
      ).ok,
    ).toBe(true)
  })

  it('does not silently infer Human Versatile or Skillful', () => {
    expect(PRE_PHASE1_HUMAN_SELECTION.choices).not.toHaveProperty('skillful')
    expect(PRE_PHASE1_HUMAN_SELECTION.choices).not.toHaveProperty('versatile')
  })

  it('resolves Wood Elf walk speed to 35 and Keen Senses skill', () => {
    const selection = {
      ...COMPLETE_WOOD_ELF_SELECTION,
      choices: { ...COMPLETE_WOOD_ELF_SELECTION.choices },
    }
    expect(resolveSpeciesWalkSpeed(elfSrd2024, selection)).toBe(35)
    expect(
      resolveSpeciesEffects(elfSrd2024, selection).some(
        (effect) =>
          effect.kind === 'skill-proficiency' && effect.skillId === 'perception',
      ),
    ).toBe(true)
  })

  it('resolves Human size choice onto the size effect', () => {
    const selection = {
      speciesId: 'srd-2024:human',
      choices: {
        size: 'small',
        skillful: 'athletics',
        versatile: 'srd-2024:alert',
        'standard-languages': ['dwarvish', 'elvish'],
      },
    }
    expect(resolveSpeciesSize(humanSrd2024, selection)).toBe('small')
  })

  it('resolves Gnomish Cunning as ability save advantage', () => {
    const effects = resolveSpeciesEffects(gnomeSrd2024, {
      speciesId: 'srd-2024:gnome',
      choices: {
        'gnomish-lineage': 'forest-gnome',
        'spellcasting-ability': 'intelligence',
        'standard-languages': ['gnomish', 'elvish'],
      },
    })

    expect(effects).toContainEqual({
      kind: 'save-advantage-ability',
      abilities: ['intelligence', 'wisdom', 'charisma'],
    })
  })

  it('loads a pre-Phase-1 Human species definition without throwing', async () => {
    const catalog = createBundledSpeciesCatalog()
    const definition = await catalog.getSpecies('srd-2024:human')
    expect(definition).not.toBeNull()
    expect(definition?.choices.map((choice) => choice.id)).toEqual([
      'size',
      'skillful',
      'versatile',
    ])
  })
})
