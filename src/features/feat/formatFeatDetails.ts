import type { FeatDefinition } from '../../domain/feat/types'

const CATEGORY_LABELS: Record<FeatDefinition['category'], string> = {
  origin: 'Origin Feat',
  general: 'General Feat',
  'fighting-style': 'Fighting Style Feat',
  'epic-boon': 'Epic Boon',
}

export function formatFeatCategory(category: FeatDefinition['category']): string {
  return CATEGORY_LABELS[category]
}

export function formatFeatCategoryBadge(
  category: FeatDefinition['category'],
): string {
  switch (category) {
    case 'origin':
      return 'Origin'
    case 'general':
      return 'General'
    case 'fighting-style':
      return 'Fighting Style'
    case 'epic-boon':
      return 'Epic Boon'
  }
}
