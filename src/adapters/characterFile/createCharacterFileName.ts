import type { Character } from '../../domain/types'
import { CHARACTER_FILE_EXTENSION } from './constants'

function slugifyCharacterName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug.length > 0 ? slug : 'unnamed-character'
}

export function createCharacterFileName(character: Character): string {
  return `${slugifyCharacterName(character.name)}${CHARACTER_FILE_EXTENSION}`
}
