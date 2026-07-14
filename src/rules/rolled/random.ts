import type { DieValue } from './abilityScoreResult'

export type RandomSource = () => number

export function rollD6(rng: RandomSource): DieValue {
  const raw = Math.floor(rng() * 6) + 1
  return Math.min(6, Math.max(1, raw)) as DieValue
}

/** Deterministic RNG for tests. */
export function createSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
