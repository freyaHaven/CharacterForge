import type { Character } from '../../domain/types'
import { CHARACTER_FILE_MEDIA_TYPE } from './constants'
import { createCharacterFileName } from './createCharacterFileName'
import { serializeCharacterFile } from './serializeCharacterFile'

export function downloadCharacterFile(character: Character): void {
  const content = serializeCharacterFile(character)
  const blob = new Blob([content], { type: CHARACTER_FILE_MEDIA_TYPE })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = createCharacterFileName(character)
  link.rel = 'noopener'
  link.click()
  URL.revokeObjectURL(objectUrl)
}
