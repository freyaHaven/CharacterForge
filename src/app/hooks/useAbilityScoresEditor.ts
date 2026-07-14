import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { AbilityScores, Character } from '../../domain/types'
import {
  adjustPointBuyDraftScore,
  createMinimumPointBuyDraft,
  initializePointBuyDraftFromAbilityScores,
  resetPointBuyDraft,
  type PointBuyDraftScores,
} from '../../features/ability-scores/pointBuyDraft'
import {
  assignRolledResult,
  initializeRolledDraftFromAbilityScores,
  rolledDraftToAbilityScores,
  type RolledDraft,
  validateRolledDraft,
} from '../../features/ability-scores/rolledDraft'
import {
  abilityScoresToStandardArrayDraft,
  createEmptyStandardArrayDraft,
  defaultStandardArrayDraft,
  standardArrayDraftToAbilityScores,
  type StandardArrayDraftScores,
  validateStandardArrayDraft,
} from '../../features/ability-scores/standardArrayDraft'
import { validatePointBuyAssignment } from '../../rules/point-buy'

type UseAbilityScoresEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  onDraftChange?: () => void
}

export function useAbilityScoresEditor({
  character,
  setCharacter,
  onDraftChange,
}: UseAbilityScoresEditorOptions) {
  const [standardArrayDraft, setStandardArrayDraft] =
    useState<StandardArrayDraftScores | null>(null)
  const [pointBuyDraft, setPointBuyDraft] = useState<PointBuyDraftScores | null>(
    null,
  )
  const [rolledDraft, setRolledDraft] = useState<RolledDraft | null>(null)
  const [abilityScoresTouched, setAbilityScoresTouched] = useState(false)

  const markAbilityScoresTouched = useCallback(() => {
    setAbilityScoresTouched(true)
  }, [])

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const hydrateFromCharacter = useCallback((loaded: Character) => {
    setStandardArrayDraft(null)
    setPointBuyDraft(null)
    setRolledDraft(null)

    if (loaded.creationMethod === 'standard-array') {
      setStandardArrayDraft(
        abilityScoresToStandardArrayDraft(loaded.abilityScores),
      )
    }
    if (loaded.creationMethod === 'point-buy') {
      setPointBuyDraft(
        initializePointBuyDraftFromAbilityScores(loaded.abilityScores),
      )
    }
    if (loaded.creationMethod === 'rolled') {
      setRolledDraft(
        initializeRolledDraftFromAbilityScores(loaded.abilityScores),
      )
    }
  }, [])

  const standardArrayValidation =
    character.creationMethod === 'standard-array' && standardArrayDraft !== null
      ? validateStandardArrayDraft(standardArrayDraft)
      : null
  const pointBuyValidation =
    character.creationMethod === 'point-buy' && pointBuyDraft !== null
      ? validatePointBuyAssignment(pointBuyDraft)
      : null
  const rolledValidation =
    character.creationMethod === 'rolled' && rolledDraft !== null
      ? validateRolledDraft(rolledDraft)
      : null

  const updateAbilityScore = useCallback(
    (ability: keyof AbilityScores, value: number) => {
      markAbilityScoresTouched()
      setCharacter((current) => ({
        ...current,
        abilityScores: {
          ...current.abilityScores,
          [ability]: value,
        },
      }))
      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const replaceStandardArrayDraft = useCallback(
    (nextDraft: StandardArrayDraftScores) => {
      markAbilityScoresTouched()
      setStandardArrayDraft(nextDraft)

      if (validateStandardArrayDraft(nextDraft).valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: standardArrayDraftToAbilityScores(nextDraft),
        }))
      }

      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const replacePointBuyDraft = useCallback(
    (nextDraft: PointBuyDraftScores) => {
      markAbilityScoresTouched()
      setPointBuyDraft(nextDraft)

      if (validatePointBuyAssignment(nextDraft).valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: { ...nextDraft },
        }))
      }

      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const updateStandardArrayDraft = useCallback(
    (ability: keyof StandardArrayDraftScores, value: number | null) => {
      markAbilityScoresTouched()
      setStandardArrayDraft((current) => {
        if (current === null) {
          return current
        }

        const nextDraft = {
          ...current,
          [ability]: value,
        }
        const validation = validateStandardArrayDraft(nextDraft)

        if (validation.valid) {
          setCharacter((currentCharacter) => ({
            ...currentCharacter,
            abilityScores: standardArrayDraftToAbilityScores(nextDraft),
          }))
        }

        return nextDraft
      })
      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const updatePointBuyDraft = useCallback(
    (ability: keyof PointBuyDraftScores, delta: -1 | 1) => {
      markAbilityScoresTouched()
      setPointBuyDraft((current) => {
        if (current === null) {
          return current
        }

        const nextDraft = adjustPointBuyDraftScore(current, ability, delta)

        if (validatePointBuyAssignment(nextDraft).valid) {
          setCharacter((currentCharacter) => ({
            ...currentCharacter,
            abilityScores: { ...nextDraft },
          }))
        }

        return nextDraft
      })
      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const replaceRolledDraft = useCallback(
    (nextDraft: RolledDraft) => {
      markAbilityScoresTouched()
      setRolledDraft(nextDraft)

      if (validateRolledDraft(nextDraft).valid) {
        setCharacter((currentCharacter) => ({
          ...currentCharacter,
          abilityScores: rolledDraftToAbilityScores(nextDraft),
        }))
      }

      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const updateRolledAssignment = useCallback(
    (ability: keyof RolledDraft['assignments'], rollId: string | null) => {
      markAbilityScoresTouched()
      setRolledDraft((current) => {
        if (current === null) {
          return current
        }

        const nextDraft = assignRolledResult(current, ability, rollId)
        const validation = validateRolledDraft(nextDraft)

        if (validation.valid) {
          setCharacter((currentCharacter) => ({
            ...currentCharacter,
            abilityScores: rolledDraftToAbilityScores(nextDraft),
          }))
        }

        return nextDraft
      })
      notifyDraftChange()
    },
    [markAbilityScoresTouched, notifyDraftChange, setCharacter],
  )

  const handleCreationMethodChange = useCallback(
    (creationMethod: Character['creationMethod']) => {
      markAbilityScoresTouched()
      setCharacter((current) => ({ ...current, creationMethod }))
      notifyDraftChange()

      if (creationMethod === 'standard-array') {
        setStandardArrayDraft(
          abilityScoresToStandardArrayDraft(character.abilityScores),
        )
        setPointBuyDraft(null)
        setRolledDraft(null)
        return
      }

      if (creationMethod === 'point-buy') {
        setPointBuyDraft(
          initializePointBuyDraftFromAbilityScores(character.abilityScores),
        )
        setStandardArrayDraft(null)
        setRolledDraft(null)
        return
      }

      if (creationMethod === 'rolled') {
        setRolledDraft(null)
        setStandardArrayDraft(null)
        setPointBuyDraft(null)
        return
      }

      setStandardArrayDraft(null)
      setPointBuyDraft(null)
      setRolledDraft(null)
    },
    [
      character.abilityScores,
      markAbilityScoresTouched,
      notifyDraftChange,
      setCharacter,
    ],
  )

  return {
    standardArrayDraft,
    pointBuyDraft,
    rolledDraft,
    abilityScoresTouched,
    standardArrayValidation,
    pointBuyValidation,
    rolledValidation,
    hydrateFromCharacter,
    updateAbilityScore,
    replaceStandardArrayDraft,
    replacePointBuyDraft,
    updateStandardArrayDraft,
    updatePointBuyDraft,
    replaceRolledDraft,
    updateRolledAssignment,
    handleCreationMethodChange,
    clearStandardArrayDraft: () => {
      replaceStandardArrayDraft(createEmptyStandardArrayDraft())
    },
    applyDefaultStandardArray: () => {
      replaceStandardArrayDraft(defaultStandardArrayDraft())
    },
    startPointBuy: () => {
      replacePointBuyDraft(createMinimumPointBuyDraft())
    },
    resetPointBuy: () => {
      replacePointBuyDraft(resetPointBuyDraft())
    },
  }
}
