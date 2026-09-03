"use client"

import { useEffect, useRef } from "react"

import AvailableAction from "@/classes/AvailableAction"
import PublicGameState from "@/classes/PublicGameState"
import { PendingBattle } from "@/helpers/pendingBattle"
import useCustomActionForm from "@/hooks/useCustomActionForm"

const signed = (value: number): string =>
  value >= 0 ? `+${value}` : String(value)

interface Props {
  battle: PendingBattle
  publicGameState: PublicGameState
  // Present only for the commander's own player
  attackAction: AvailableAction | null
  onClose: () => void
}

const PendingBattleOverlay = ({
  battle,
  publicGameState,
  attackAction,
  onClose,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { feedback, loading, submit } = useCustomActionForm({
    availableAction: attackAction,
    publicGameState,
  })

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const unitWord = battle.isNaval ? "fleets" : "legions"
  const outcomes: [string, number, string][] = [
    ["Victory", battle.odds.victory, "text-emerald-700"],
    ["Stalemate", battle.odds.stalemate, "text-neutral-700"],
    ["Defeat", battle.odds.defeat, "text-red-700"],
    ["Standoff", battle.odds.standoff, "text-amber-700"],
    ["Disaster", battle.odds.disaster, "text-red-800"],
  ]

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[32rem] max-w-[90vw] animate-overlay-in rounded-lg bg-white p-6 shadow-lg backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-xl">
            {battle.commander.displayName} fought the {battle.war.name}
          </div>
          <div className="text-sm text-neutral-600">
            {battle.isNaval ? "Naval" : "Land"} battle
            {battle.masterOfHorse &&
              ` · with ${battle.masterOfHorse.displayName}`}
          </div>
        </div>

        <div className="rounded border border-neutral-300 bg-white/60 p-3 text-sm">
          <div className="flex justify-between gap-6">
            <span>
              {battle.unitCount} {unitWord}
            </span>
            <span className="tabular-nums">{battle.unitStrength}</span>
          </div>
          <div
            className={`flex justify-between gap-6 ${battle.commanderStrength < battle.commanderMilitary ? "text-neutral-600" : ""}`}
          >
            <span>Military rating {battle.commanderMilitary}</span>
            <span className="tabular-nums">
              {signed(battle.commanderStrength)}
            </span>
          </div>
          <div className="my-1 border-t border-neutral-300" />
          <div className="flex justify-between gap-6">
            <span>Force strength</span>
            <span className="tabular-nums">
              {battle.unitStrength + battle.commanderStrength}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span>{battle.war.name}</span>
            <span className="tabular-nums">{signed(-battle.warStrength)}</span>
          </div>
          {battle.evilOmens > 0 && (
            <div className="flex justify-between gap-6">
              <span>Evil omens</span>
              <span className="tabular-nums">{signed(-battle.evilOmens)}</span>
            </div>
          )}
          <div className="my-1 border-t border-neutral-300" />
          <div className="flex justify-between gap-6">
            <span>Modifier</span>
            <span className="tabular-nums">{signed(battle.modifier)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded border border-neutral-500 bg-neutral-100 px-3 py-1 text-lg font-semibold uppercase tracking-wide text-neutral-700">
            Underway
          </div>
          <div className="flex flex-col text-sm text-neutral-600">
            {outcomes.map(([label, value, colour]) => (
              <span key={label}>
                <span className={colour}>{label}</span>{" "}
                <span className="tabular-nums">{value}%</span>
              </span>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="inline-flex rounded-md bg-red-50 px-2 py-1 text-red-600">
            <p>{feedback}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-neutral-600">
            {attackAction
              ? "Your commander awaits the order."
              : `Waiting for ${battle.commander.displayName}…`}
          </span>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="select-none rounded-md border border-neutral-600 px-4 py-1 text-neutral-600 hover:bg-neutral-100"
            >
              Close
            </button>
            {attackAction && (
              <button
                type="button"
                disabled={loading}
                onClick={() => submit({})}
                className="select-none rounded-md border border-blue-600 px-4 py-1 text-blue-600 hover:bg-blue-100 disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent"
              >
                Attack
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default PendingBattleOverlay
