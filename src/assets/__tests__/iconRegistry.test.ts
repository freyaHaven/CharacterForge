import { describe, expect, it } from 'vitest'
import {
  getClassIcon,
  getClassInsignia,
  getRaceIcon,
  getSystemIcon,
} from '../iconRegistry'

describe('iconRegistry', () => {
  it('resolves race icons by SRD species id suffix', () => {
    expect(getRaceIcon('srd-2024:dwarf')).toMatch(/dwarf\.png$/)
    expect(getRaceIcon('srd-2024:half-elf')).toMatch(/half_elf\.png$/)
    expect(getRaceIcon('srd-2024:unknown')).toBeNull()
  })

  it('resolves compact class icons and filename aliases', () => {
    expect(getClassIcon('srd-2024:fighter')).toMatch(/fighter\.png$/)
    expect(getClassIcon('srd-2024:artificer')).toMatch(/artificier\.png$/)
    expect(getClassIcon('srd-2024:ranger')).toMatch(/archer\.png$/)
    expect(getClassIcon('srd-2024:unknown')).toBeNull()
  })

  it('resolves class insignias for selection cards', () => {
    expect(getClassInsignia('srd-2024:fighter')).toMatch(/fighter\.png$/)
    expect(getClassInsignia('srd-2024:ranger')).toMatch(/archer\.png$/)
    expect(getClassInsignia('srd-2024:artificer')).toMatch(/artificier\.png$/)
    expect(getClassInsignia('srd-2024:unknown')).toBeNull()
  })

  it('resolves system icons from PNG assets', () => {
    expect(getSystemIcon('strength', 50)).toMatch(/strength\.png$/)
    expect(getSystemIcon('armor', 50)).toMatch(/armor\.png$/)
    expect(getSystemIcon('initiative', 50)).toMatch(/initiative\.png$/)
    expect(getSystemIcon('settings', 50)).toMatch(/settings\.png$/)
    expect(getSystemIcon('warning', 50)).toMatch(/warning\.png$/)
    expect(getSystemIcon('unknown', 50)).toBeNull()
  })

  it('resolves system icon aliases for combat and incomplete states', () => {
    expect(getSystemIcon('hit-points', 50)).toMatch(/constitution\.png$/)
    expect(getSystemIcon('armor-class', 50)).toMatch(/armor\.png$/)
    expect(getSystemIcon('incomplete', 50)).toMatch(/warning\.png$/)
  })
})
