import type { ClassDefinition } from '../domain/class/types'

const SYNTHETIC_SOURCE = {
  id: 'test-source',
  name: 'Synthetic Test Source',
  version: '1',
  licence: 'test',
  attribution: 'test',
  documentUrl: 'https://example.test',
} as const

/**
 * Minimal ClassDefinition for domain/rules unit tests.
 * Does not import content packs.
 */
export function createSyntheticClassDefinition(
  overrides: Partial<ClassDefinition> = {},
): ClassDefinition {
  return {
    id: 'test:sample-class',
    editionId: 'srd-2024',
    name: 'Sample Class',
    description: 'A synthetic class for unit tests.',
    source: SYNTHETIC_SOURCE,
    hitDie: { sides: 8 },
    primaryAbilities: ['strength'],
    multiclassPrerequisite: {
      kind: 'all-of',
      abilities: ['strength'],
      minimum: 13,
      summary: 'Strength 13',
    },
    savingThrows: ['strength', 'constitution'],
    proficiencies: {
      armor: ['light'],
      weapons: ['simple'],
      tools: [],
      skillOptions: ['athletics', 'perception', 'survival'],
    },
    featureProgression: [
      {
        level: 1,
        features: [
          {
            id: 'sample-feature',
            name: 'Sample Feature',
            description: 'Does something useful.',
          },
        ],
      },
      {
        level: 3,
        features: [
          {
            id: 'sample-subclass',
            name: 'Subclass',
            description: 'Choose a subclass.',
          },
        ],
      },
    ],
    choices: [
      {
        id: 'skill-proficiencies',
        level: 1,
        prompt: 'Choose skills',
        type: 'multi-select',
        required: true,
        min: 2,
        max: 2,
        options: [
          {
            id: 'athletics',
            label: 'Athletics',
            effects: [{ kind: 'skill-proficiency', skillId: 'athletics' }],
          },
          {
            id: 'perception',
            label: 'Perception',
            effects: [{ kind: 'skill-proficiency', skillId: 'perception' }],
          },
          {
            id: 'survival',
            label: 'Survival',
            effects: [{ kind: 'skill-proficiency', skillId: 'survival' }],
          },
        ],
      },
      {
        id: 'sample-subclass',
        level: 3,
        prompt: 'Choose a subclass',
        type: 'single-select',
        required: true,
        options: [
          {
            id: 'path-a',
            label: 'Path A',
            features: [
              {
                id: 'path-a-feature',
                name: 'Path A Feature',
                level: 3,
                description: 'A subclass feature.',
              },
            ],
          },
        ],
      },
    ],
    deferredRequirements: [],
    startingEquipment: {
      completeness: 'complete',
      entitlements: [],
    },
    ...overrides,
  }
}
