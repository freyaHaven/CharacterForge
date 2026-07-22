import { describe, expect, it } from 'vitest'
import { alertSrd2024 } from '../../../content/packs/srd-2024/feats/alert'
import {
  hasInitiativeProficiency,
  resolveCharacterFeatEffects,
  resolveFeatDefinitionEffects,
} from '../resolveFeatEffects'

describe('resolveFeatEffects', () => {
  it('reads initiative proficiency from Alert', () => {
    const effects = resolveFeatDefinitionEffects(alertSrd2024)
    expect(effects).toEqual([{ kind: 'initiative-proficiency' }])
    expect(hasInitiativeProficiency(effects)).toBe(true)
  })

  it('collects effects from resolved grants', () => {
    const effects = resolveCharacterFeatEffects(
      [
        {
          featId: alertSrd2024.id,
          choices: {},
          source: {
            kind: 'background-origin',
            backgroundId: 'srd-2024:criminal',
            backgroundName: 'Criminal',
          },
          displayLabel: 'Background',
        },
      ],
      new Map([[alertSrd2024.id, alertSrd2024]]),
    )

    expect(hasInitiativeProficiency(effects)).toBe(true)
  })
})
