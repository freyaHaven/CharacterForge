import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = join(process.cwd(), 'src')

const GUARDED_ROOTS = ['domain', 'rules', 'features', 'app'] as const

/** Production source extensions (exclude tests). */
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

const PACK_IMPORT_PATTERN =
  /from\s+['"][^'"]*content\/packs(?:\/[^'"]*)?['"]|import\s*\(\s*['"][^'"]*content\/packs/

function isTestFile(filePath: string): boolean {
  return (
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.endsWith('.d.ts')
  )
}

function collectProductionFiles(directory: string): string[] {
  const entries = readdirSync(directory)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(directory, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...collectProductionFiles(fullPath))
      continue
    }

    const extension = entry.slice(entry.lastIndexOf('.'))
    if (!SOURCE_EXTENSIONS.has(extension) || isTestFile(fullPath)) {
      continue
    }

    files.push(fullPath)
  }

  return files
}

describe('content pack import boundaries', () => {
  it('forbids production domain/rules/features/app from importing content packs', () => {
    const violations: string[] = []

    for (const root of GUARDED_ROOTS) {
      const rootPath = join(SRC_ROOT, root)
      for (const filePath of collectProductionFiles(rootPath)) {
        const source = readFileSync(filePath, 'utf8')
        if (PACK_IMPORT_PATTERN.test(source)) {
          violations.push(relative(SRC_ROOT, filePath).replaceAll('\\', '/'))
        }
      }
    }

    expect(
      violations,
      `Production modules must not import src/content/packs/. Violations:\n${violations.join('\n')}`,
    ).toEqual([])
  })

  it('allows test-only fixture modules under src/testing to import packs', () => {
    const fixtures = readFileSync(
      join(SRC_ROOT, 'testing', 'classFixtures.ts'),
      'utf8',
    )
    expect(fixtures).toMatch(/content\/packs/)
  })
})
