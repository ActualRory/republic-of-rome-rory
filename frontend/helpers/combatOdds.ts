import getDiceProbability from "@/helpers/dice"

export interface CombatOdds {
  victory: number
  stalemate: number
  defeat: number
  standoff: number
  disaster: number
}

// Disaster and standoff numbers are checked against the unmodified roll and so
// are removed from the pool the combat results table is read from (§1.10.21)
export function getCombatOdds(
  modifier: number,
  disasterNumbers: number[],
  standoffNumbers: number[],
): CombatOdds {
  const ignoredNumbers = [...standoffNumbers, ...disasterNumbers]
  const asPercentage = (probability: number) => Math.round(probability * 100)
  return {
    victory: asPercentage(
      getDiceProbability(3, modifier, { min: 14 }, ignoredNumbers),
    ),
    stalemate: asPercentage(
      getDiceProbability(3, modifier, { min: 8, max: 13 }, ignoredNumbers),
    ),
    defeat: asPercentage(
      getDiceProbability(3, modifier, { max: 7 }, ignoredNumbers),
    ),
    standoff: asPercentage(
      getDiceProbability(3, 0, { exacts: standoffNumbers }),
    ),
    disaster: asPercentage(
      getDiceProbability(3, 0, { exacts: disasterNumbers }),
    ),
  }
}
