import type { CharacterDetailsReviewSections } from './formatCharacterDetailsReview'

type CharacterDetailsReviewContentProps = {
  sections: CharacterDetailsReviewSections
}

function ReviewSectionList({
  heading,
  lines,
}: {
  heading: string
  lines: string[]
}) {
  if (lines.length === 0) {
    return null
  }

  const headingId = `review-character-details-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section aria-labelledby={headingId} className="character-details-review__section">
      <h4 id={headingId}>{heading}</h4>
      <ul className="review-summary-card__details">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  )
}

export function CharacterDetailsReviewContent({
  sections,
}: CharacterDetailsReviewContentProps) {
  return (
    <div className="character-details-review">
      <ReviewSectionList heading="Identity" lines={sections.identity} />
      <ReviewSectionList heading="Personality" lines={sections.personality} />
      {sections.backstoryNotes !== null ? (
        <section
          aria-labelledby="review-character-details-backstory-heading"
          className="character-details-review__section"
        >
          <h4 id="review-character-details-backstory-heading">Backstory & Notes</h4>
          <p className="character-details-review__backstory">
            {sections.backstoryNotes}
          </p>
        </section>
      ) : null}
    </div>
  )
}
