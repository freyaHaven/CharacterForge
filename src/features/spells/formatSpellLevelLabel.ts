export function formatSpellLevelLabel(level: number): string {
  if (level <= 0) {
    return 'Cantrip'
  }

  if (level === 1) {
    return '1st-level'
  }

  if (level === 2) {
    return '2nd-level'
  }

  if (level === 3) {
    return '3rd-level'
  }

  return `${level}th-level`
}
