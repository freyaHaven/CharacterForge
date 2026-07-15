import type { AlignmentId } from '../../domain/character/alignment'
import { ALIGNMENT_IDS, ALIGNMENT_LABELS } from '../../domain/character/alignment'
import type { CharacterDetails } from '../../domain/character/details'
import type { GenderId } from '../../domain/character/gender'
import { GENDER_IDS, GENDER_LABELS } from '../../domain/character/gender'
import type { PronounId } from '../../domain/character/pronouns'
import { PRONOUN_IDS, PRONOUN_LABELS } from '../../domain/character/pronouns'
import type { SpeciesGuidance } from '../../domain/species/types'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import {
  BACKSTORY_NOTES_PLACEHOLDER,
  CHARACTER_DETAILS_ALIGNMENT_LEGEND_ID,
  CHARACTER_DETAILS_GENDER_LEGEND_ID,
  CHARACTER_DETAILS_PRONOUNS_LEGEND_ID,
} from './characterDetailsConstants'
import {
  CHARACTER_DETAILS_AGE_GUIDANCE_ID,
  CHARACTER_DETAILS_AGE_INPUT_ID,
  CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID,
  CHARACTER_DETAILS_HEIGHT_INPUT_ID,
  combineDescribedBy,
  hasSpeciesGuidanceText,
} from './characterDetailsA11y'

const ALIGNMENT_OPTIONS = ALIGNMENT_IDS.map((id) => ({
  id,
  label: ALIGNMENT_LABELS[id],
}))

const GENDER_OPTIONS = GENDER_IDS.map((id) => ({
  id,
  label: GENDER_LABELS[id],
}))

const PRONOUN_OPTIONS = PRONOUN_IDS.map((id) => ({
  id,
  label: PRONOUN_LABELS[id],
}))

type CharacterDetailsFieldsProps = {
  details: CharacterDetails
  speciesGuidance: SpeciesGuidance | null
  ageDescribedBy?: string
  heightDescribedBy?: string
  onChange: (updates: Partial<CharacterDetails>) => void
  onTouched?: () => void
}

type IdentityDetailFieldProps = {
  label: string
  inputId: string
  guidanceId?: string
  value: string
  guidance?: string
  additionalDescribedBy?: string
  onFocus: () => void
  onChange: (value: string) => void
}

function markTouched(onTouched?: () => void) {
  onTouched?.()
}

function IdentityDetailField({
  label,
  inputId,
  guidanceId,
  value,
  guidance,
  additionalDescribedBy,
  onFocus,
  onChange,
}: IdentityDetailFieldProps) {
  const showGuidance = hasSpeciesGuidanceText(guidance)
  const describedBy = combineDescribedBy(
    additionalDescribedBy,
    showGuidance && guidanceId !== undefined ? guidanceId : undefined,
  )

  return (
    <div className="character-details-fields__identity-field">
      <label className="field" htmlFor={inputId}>
        <span>{label}</span>
        <input
          id={inputId}
          type="text"
          value={value}
          aria-describedby={describedBy}
          onFocus={onFocus}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      </label>
      {showGuidance && guidanceId !== undefined ? (
        <span id={guidanceId} className="character-details-fields__help">
          {guidance}
        </span>
      ) : null}
    </div>
  )
}

export function CharacterDetailsFields({
  details,
  speciesGuidance,
  ageDescribedBy,
  heightDescribedBy,
  onChange,
  onTouched,
}: CharacterDetailsFieldsProps) {
  function updateTextField<K extends keyof CharacterDetails>(
    field: K,
    value: CharacterDetails[K],
  ) {
    markTouched(onTouched)
    onChange({ [field]: value })
  }

  function updateSingleSelectField<K extends keyof CharacterDetails>(
    field: K,
    value: CharacterDetails[K],
  ) {
    markTouched(onTouched)
    onChange({ [field]: value })
  }

  return (
    <div className="character-details-fields">
      <div className="character-details-fields__columns">
        <section
          className="character-details-fields__column character-details-fields__column--identity"
          aria-labelledby="character-details-identity-heading"
        >
          <h3 id="character-details-identity-heading">Identity</h3>

          <div
            className="character-details-fields__physical"
            aria-label="Physical details"
          >
            <IdentityDetailField
              label="Age"
              inputId={CHARACTER_DETAILS_AGE_INPUT_ID}
              guidanceId={CHARACTER_DETAILS_AGE_GUIDANCE_ID}
              value={details.age}
              guidance={speciesGuidance?.age}
              additionalDescribedBy={ageDescribedBy}
              onFocus={() => markTouched(onTouched)}
              onChange={(value) => {
                updateTextField('age', value)
              }}
            />

            <div className="character-details-fields__physical-split">
              <IdentityDetailField
                label="Height"
                inputId={CHARACTER_DETAILS_HEIGHT_INPUT_ID}
                guidanceId={CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID}
                value={details.height}
                guidance={speciesGuidance?.height}
                additionalDescribedBy={heightDescribedBy}
                onFocus={() => markTouched(onTouched)}
                onChange={(value) => {
                  updateTextField('height', value)
                }}
              />
              <IdentityDetailField
                label="Weight"
                inputId="character-details-weight"
                value={details.weight}
                onFocus={() => markTouched(onTouched)}
                onChange={(value) => {
                  updateTextField('weight', value)
                }}
              />
            </div>
          </div>

          <fieldset className="character-details-fields__choice-fieldset">
            <legend id={CHARACTER_DETAILS_GENDER_LEGEND_ID}>Gender</legend>
            <SingleSelectCardGrid
              id="character-details-gender"
              name="character-details-gender"
              options={GENDER_OPTIONS}
              selectedOptionId={details.gender}
              ariaLabelledBy={CHARACTER_DETAILS_GENDER_LEGEND_ID}
              onSelect={(optionId) => {
                updateSingleSelectField('gender', optionId as GenderId)
              }}
            />
          </fieldset>

          <fieldset className="character-details-fields__choice-fieldset">
            <legend id={CHARACTER_DETAILS_PRONOUNS_LEGEND_ID}>Pronouns</legend>
            <SingleSelectCardGrid
              id="character-details-pronouns"
              name="character-details-pronouns"
              options={PRONOUN_OPTIONS}
              selectedOptionId={details.pronouns}
              ariaLabelledBy={CHARACTER_DETAILS_PRONOUNS_LEGEND_ID}
              onSelect={(optionId) => {
                updateSingleSelectField('pronouns', optionId as PronounId)
              }}
            />
          </fieldset>

          <div className="character-details-fields__colour-fields">
            <label className="field">
              <span>Eye Colour</span>
              <input
                type="text"
                value={details.eyeColour}
                onFocus={() => markTouched(onTouched)}
                onChange={(event) => {
                  updateTextField('eyeColour', event.target.value)
                }}
              />
            </label>

            <label className="field">
              <span>Hair Colour</span>
              <input
                type="text"
                value={details.hairColour}
                onFocus={() => markTouched(onTouched)}
                onChange={(event) => {
                  updateTextField('hairColour', event.target.value)
                }}
              />
            </label>

            <label className="field">
              <span>Skin Tone</span>
              <input
                type="text"
                value={details.skinTone}
                onFocus={() => markTouched(onTouched)}
                onChange={(event) => {
                  updateTextField('skinTone', event.target.value)
                }}
              />
            </label>
          </div>
        </section>

        <section
          className="character-details-fields__column character-details-fields__column--personality"
          aria-labelledby="character-details-personality-heading"
        >
          <h3 id="character-details-personality-heading">Personality</h3>

          <fieldset className="character-details-fields__choice-fieldset">
            <legend id={CHARACTER_DETAILS_ALIGNMENT_LEGEND_ID}>Alignment</legend>
            <SingleSelectCardGrid
              id="character-alignment"
              name="character-alignment"
              options={ALIGNMENT_OPTIONS}
              selectedOptionId={details.alignment}
              ariaLabelledBy={CHARACTER_DETAILS_ALIGNMENT_LEGEND_ID}
              onSelect={(optionId) => {
                updateSingleSelectField('alignment', optionId as AlignmentId)
              }}
            />
          </fieldset>

          <label className="field">
            <span>Personality Traits</span>
            <textarea
              rows={4}
              value={details.personalityTraits}
              onFocus={() => markTouched(onTouched)}
              onChange={(event) => {
                updateTextField('personalityTraits', event.target.value)
              }}
            />
          </label>

          <label className="field">
            <span>Ideals</span>
            <textarea
              rows={4}
              value={details.ideals}
              onFocus={() => markTouched(onTouched)}
              onChange={(event) => {
                updateTextField('ideals', event.target.value)
              }}
            />
          </label>

          <label className="field">
            <span>Bonds</span>
            <textarea
              rows={4}
              value={details.bonds}
              onFocus={() => markTouched(onTouched)}
              onChange={(event) => {
                updateTextField('bonds', event.target.value)
              }}
            />
          </label>

          <label className="field">
            <span>Flaws</span>
            <textarea
              rows={4}
              value={details.flaws}
              onFocus={() => markTouched(onTouched)}
              onChange={(event) => {
                updateTextField('flaws', event.target.value)
              }}
            />
          </label>
        </section>
      </div>

      <section
        className="character-details-fields__backstory"
        aria-labelledby="character-details-backstory-heading"
      >
        <h3 id="character-details-backstory-heading">Backstory & Notes</h3>

        <label className="field">
          <span className="sr-only">Backstory & Notes</span>
          <textarea
            className="character-details-fields__backstory-input"
            rows={8}
            placeholder={BACKSTORY_NOTES_PLACEHOLDER}
            value={details.backstoryNotes}
            onFocus={() => markTouched(onTouched)}
            onChange={(event) => {
              updateTextField('backstoryNotes', event.target.value)
            }}
          />
        </label>
      </section>
    </div>
  )
}
