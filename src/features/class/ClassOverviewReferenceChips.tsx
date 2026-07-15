export type ClassOverviewReferenceChipsProps = {
  items: string[]
}

export function ClassOverviewReferenceChips({
  items,
}: ClassOverviewReferenceChipsProps) {
  return (
    <div className="class-picker__overview-chips">
      {items.map((item) => (
        <span key={item} className="class-picker__overview-chip">
          {item}
        </span>
      ))}
    </div>
  )
}
