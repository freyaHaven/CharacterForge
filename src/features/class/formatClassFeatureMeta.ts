export function formatOrdinalLevel(level: number): string {
  const absolute = Math.abs(level)
  const mod100 = absolute % 100
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? 'th'
      : absolute % 10 === 1
        ? 'st'
        : absolute % 10 === 2
          ? 'nd'
          : absolute % 10 === 3
            ? 'rd'
            : 'th'

  return `${level}${suffix} level`
}

export function formatChoiceCountLabel(count: number): string {
  return count === 1 ? '1 choice' : `${count} choices`
}
