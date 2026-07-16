import type { ContentPackManifest } from '../../types/contentPack'
import { SRD_2024_SOURCE } from './source'

export const srd2024Manifest: ContentPackManifest = {
  id: 'srd-2024',
  name: 'System Reference Document 5.2',
  version: '5.2.1',
  editionId: 'srd-2024',
  description:
    'Official SRD 5.2 content bundled with Character Forge.',
  source: SRD_2024_SOURCE,
}
