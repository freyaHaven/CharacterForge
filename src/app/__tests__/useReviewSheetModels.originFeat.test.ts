import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { buildReviewSheetModels } from '../buildReviewSheetModels'

describe('origin feat catalog resolution', () => {
  it('resolves the background origin feat via featId without manufacturing pack prefixes', async () => {
    const backgroundDefinition = await createBundledBackgroundCatalog().getBackground(
      'srd-2024:soldier',
    )
    expect(backgroundDefinition).not.toBeNull()
    expect(backgroundDefinition!.originFeat.featId).toBe('srd-2024:savage-attacker')
    expect(backgroundDefinition!.originFeat.featId).not.toMatch(/^srd-2024:srd-2024:/)

    const originFeatDefinition = await createBundledFeatCatalog().getFeat(
      backgroundDefinition!.originFeat.featId,
    )
    expect(originFeatDefinition?.name).toBe('Savage Attacker')

    const models = buildReviewSheetModels({
      character: createDefaultCharacter({
        background: {
          backgroundId: 'srd-2024:soldier',
          abilityScoreIncrease: {
            mode: 'two-and-one',
            plusTwo: 'strength',
            plusOne: 'constitution',
          },
          choices: { 'gaming-set': 'dice-set' },
        },
        feat: null,
      }),
      speciesDefinition: null,
      backgroundDefinition,
      featDefinition: null,
      originFeatDefinition,
      classDefinitions: new Map(),
    })

    expect(models.feat?.name).toBe('Savage Attacker')
    expect(models.feat?.source).toBe('background-origin')
    expect(models.feat?.sourceLabel).toBe('Soldier')
    expect(models.feats).toHaveLength(1)
  })

  it('keeps useReviewSheetModels free of hardcoded srd-2024 feat namespaces', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const source = readFileSync(
      join(process.cwd(), 'src/app/useReviewSheetModels.ts'),
      'utf8',
    )

    expect(source).not.toMatch(/`srd-2024:\$\{/)
    expect(source).toMatch(/originFeat\.featId/)
  })
})
