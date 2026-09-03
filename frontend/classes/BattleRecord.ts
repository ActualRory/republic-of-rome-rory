export type BattleResult =
  | "victory"
  | "stalemate"
  | "defeat"
  | "standoff"
  | "disaster"

export interface BattleRecord {
  commander: string
  masterOfHorse: string | null
  war: string
  battleType: "land" | "naval"
  dice: number[]
  roll: number
  unitStrength: number
  unitCount: number
  commanderMilitary: number
  commanderStrength: number
  warStrength: number
  matchingWarMultiplier: number
  leaderStrength: number
  evilOmens: number
  modifier: number
  modifiedRoll: number
  result: BattleResult
  nullified: boolean
  warEnds: boolean
  unrestChange: number
  spoils: number
  legionsLost: string[]
  fleetsLost: string[]
  legionsSurviving: string[]
  fleetsSurviving: string[]
  fabiusSavedLegions: number
  fabiusSavedFleets: number
  commanderKilled: boolean
  masterOfHorseKilled: boolean
  chitsDrawn: string[]
  glory: number
  popularityChange: number
  veteran: string | null
}

const RESULTS: BattleResult[] = [
  "victory",
  "stalemate",
  "defeat",
  "standoff",
  "disaster",
]

const num = (data: Record<string, unknown>, key: string): number =>
  typeof data[key] === "number" ? (data[key] as number) : 0

const str = (data: Record<string, unknown>, key: string): string | null =>
  typeof data[key] === "string" ? (data[key] as string) : null

const strings = (data: Record<string, unknown>, key: string): string[] =>
  Array.isArray(data[key]) ? (data[key] as unknown[]).map(String) : []

const numbers = (data: Record<string, unknown>, key: string): number[] =>
  Array.isArray(data[key])
    ? (data[key] as unknown[]).filter((v): v is number => typeof v === "number")
    : []

// Battles fought before the record existed have only their log text, so the
// report falls back to that rather than rendering an empty card
export function parseBattleRecord(
  data: Record<string, unknown>,
): BattleRecord | null {
  const result = str(data, "result")
  const war = str(data, "war")
  const commander = str(data, "commander")
  if (!war || !commander || !RESULTS.includes(result as BattleResult)) {
    return null
  }

  return {
    commander,
    masterOfHorse: str(data, "master_of_horse"),
    war,
    battleType: data["battle_type"] === "naval" ? "naval" : "land",
    dice: numbers(data, "dice"),
    roll: num(data, "roll"),
    unitStrength: num(data, "unit_strength"),
    unitCount: num(data, "unit_count"),
    commanderMilitary: num(data, "commander_military"),
    commanderStrength: num(data, "commander_strength"),
    warStrength: num(data, "war_strength"),
    matchingWarMultiplier: num(data, "matching_war_multiplier"),
    leaderStrength: num(data, "leader_strength"),
    evilOmens: num(data, "evil_omens"),
    modifier: num(data, "modifier"),
    modifiedRoll: num(data, "modified_roll"),
    result: result as BattleResult,
    nullified: data["nullified"] === true,
    warEnds: data["war_ends"] === true,
    unrestChange: num(data, "unrest_change"),
    spoils: num(data, "spoils"),
    legionsLost: strings(data, "legions_lost"),
    fleetsLost: strings(data, "fleets_lost"),
    legionsSurviving: strings(data, "legions_surviving"),
    fleetsSurviving: strings(data, "fleets_surviving"),
    fabiusSavedLegions: num(data, "fabius_saved_legions"),
    fabiusSavedFleets: num(data, "fabius_saved_fleets"),
    commanderKilled: data["commander_killed"] === true,
    masterOfHorseKilled: data["master_of_horse_killed"] === true,
    chitsDrawn: strings(data, "chits_drawn"),
    glory: num(data, "glory"),
    popularityChange: num(data, "popularity_change"),
    veteran: str(data, "veteran"),
  }
}
