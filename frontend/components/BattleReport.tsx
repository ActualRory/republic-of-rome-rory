"use client"

import { BattleRecord, BattleResult } from "@/classes/BattleRecord"
import Die from "@/components/Die"

const RESULT_STYLES: Record<BattleResult, string> = {
  victory: "border-emerald-600 bg-emerald-50 text-emerald-700",
  stalemate: "border-neutral-500 bg-neutral-100 text-neutral-700",
  defeat: "border-red-600 bg-red-50 text-red-700",
  standoff: "border-amber-600 bg-amber-50 text-amber-700",
  disaster: "border-red-700 bg-red-100 text-red-800",
}

const formatUnits = (names: string[]): string => {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

const signed = (value: number): string =>
  value >= 0 ? `+${value}` : String(value)

interface Props {
  record: BattleRecord
  // How many reveal beats to show. Omit to show the whole report at once
  beat?: number
  size?: "compact" | "full"
}

const BattleReport = ({ record, beat, size = "compact" }: Props) => {
  const full = size === "full"
  const visible = (required: number) => beat === undefined || beat >= required

  const unitWord = record.battleType === "naval" ? "fleets" : "legions"
  const lost =
    record.battleType === "naval" ? record.fleetsLost : record.legionsLost
  const surviving =
    record.battleType === "naval"
      ? record.fleetsSurviving
      : record.legionsSurviving

  const ignoresTable =
    record.result === "disaster" || record.result === "standoff"
  const forceStrength = record.unitStrength + record.commanderStrength

  const row = (label: string, value: string, muted = false) => (
    <div
      className={`flex justify-between gap-6 ${muted ? "text-neutral-600" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )

  return (
    <div className={`flex flex-col ${full ? "gap-5" : "gap-3"}`}>
      <div>
        <div className={full ? "text-xl" : "font-semibold"}>
          {record.commander} against the {record.war}
        </div>
        <div className="text-sm capitalize text-neutral-600">
          {record.battleType} battle
          {record.masterOfHorse && ` · with ${record.masterOfHorse}`}
        </div>
      </div>

      {visible(1) && (
        <div className="animate-battle-beat rounded border border-neutral-300 bg-white/60 p-3 text-sm">
          {row(`${record.unitCount} ${unitWord}`, String(record.unitStrength))}
          {row(
            `Military rating ${record.commanderMilitary}`,
            signed(record.commanderStrength),
            record.commanderStrength < record.commanderMilitary,
          )}
          <div className="my-1 border-t border-neutral-300" />
          {row("Force strength", String(forceStrength))}
          {row(
            `${record.war}${record.matchingWarMultiplier > 1 ? ` ×${record.matchingWarMultiplier}` : ""}`,
            signed(-record.warStrength * record.matchingWarMultiplier),
          )}
          {record.leaderStrength > 0 &&
            row("Enemy leader", signed(-record.leaderStrength))}
          {record.evilOmens > 0 && row("Evil omens", signed(-record.evilOmens))}
          <div className="my-1 border-t border-neutral-300" />
          {row("Modifier", signed(record.modifier))}
        </div>
      )}

      {visible(2) && (
        <div className="flex animate-battle-beat items-center gap-4">
          <div className="flex gap-2">
            {record.dice.map((face, i) => (
              <Die key={i} value={face} size={full ? "lg" : "sm"} />
            ))}
          </div>
          {ignoresTable ? (
            <div className={`tabular-nums ${full ? "text-lg" : "text-sm"}`}>
              <span className="font-semibold">{record.roll}</span>
            </div>
          ) : (
            <div className={`tabular-nums ${full ? "text-lg" : "text-sm"}`}>
              {record.roll} {signed(record.modifier)} ={" "}
              <span className="font-semibold">{record.modifiedRoll}</span>
            </div>
          )}
        </div>
      )}

      {visible(3) && (
        <div className="flex animate-battle-beat flex-wrap items-center gap-3">
          <div
            className={`rounded border px-3 py-1 font-semibold uppercase tracking-wide ${RESULT_STYLES[record.result]} ${full ? "text-lg" : "text-sm"}`}
          >
            {record.result}
          </div>
          {ignoresTable && (
            <span className="text-sm text-neutral-600">
              {record.roll} is a {record.result} number, so the combat results
              table was ignored
            </span>
          )}
          {record.warEnds && (
            <span className="text-sm text-neutral-600">
              The {record.war} is over
            </span>
          )}
          {record.nullified && (
            <span className="text-sm text-neutral-600">
              A statesman&apos;s ability prevented the worst
            </span>
          )}
        </div>
      )}

      {visible(4) && (
        <div className="flex animate-battle-beat flex-col gap-1 text-sm">
          {lost.length > 0 ? (
            <div>
              <span className="text-neutral-600">Lost </span>
              <span className="text-red-700 line-through">
                {formatUnits(lost)}
              </span>
              <span className="text-neutral-600">
                {" "}
                · {surviving.length} {unitWord} remain
              </span>
            </div>
          ) : (
            <div className="text-neutral-600">No {unitWord} were lost</div>
          )}
          {(record.fabiusSavedLegions > 0 || record.fabiusSavedFleets > 0) && (
            <div className="text-neutral-600">
              Delaying tactics saved{" "}
              {record.fabiusSavedLegions + record.fabiusSavedFleets} more
            </div>
          )}
          {record.chitsDrawn.length > 0 && (
            <div className="text-neutral-600">
              {record.chitsDrawn.length} mortality{" "}
              {record.chitsDrawn.length === 1 ? "chit" : "chits"} drawn
            </div>
          )}
        </div>
      )}

      {visible(5) && (
        <div className="flex animate-battle-beat flex-col gap-1 text-sm">
          {record.commanderKilled && (
            <div className="font-semibold text-red-700">
              {record.commander} was killed
            </div>
          )}
          {record.masterOfHorseKilled && record.masterOfHorse && (
            <div className="font-semibold text-red-700">
              {record.masterOfHorse} was killed
            </div>
          )}
          {record.glory > 0 && (
            <div className="text-neutral-600">
              Military glory: {signed(record.glory)} influence
            </div>
          )}
          {record.popularityChange !== 0 && (
            <div className="text-neutral-600">
              Popularity {signed(record.popularityChange)}
            </div>
          )}
          {record.veteran && (
            <div className="text-neutral-600">
              Legion {record.veteran} hardened into a Veteran Legion
            </div>
          )}
          {record.spoils > 0 && (
            <div className="text-neutral-600">
              Spoils of war: {record.spoils}T to the State Treasury
            </div>
          )}
          {record.unrestChange !== 0 && (
            <div className="text-neutral-600">
              Unrest {signed(record.unrestChange)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BattleReport
