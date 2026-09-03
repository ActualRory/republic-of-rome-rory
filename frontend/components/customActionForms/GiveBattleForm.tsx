"use client"

import { SERIES_NULLIFIERS } from "@/data/statesmen"
import { getCombatOdds } from "@/helpers/combatOdds"
import { getEvilOmensLevel } from "@/helpers/gameEffects"
import { getActiveLeaders, getWarStrengthBreakdown } from "@/helpers/wars"
import useCustomActionForm from "@/hooks/useCustomActionForm"

import { CustomActionFormProps } from "../ActionBar"
import ActionDescription from "../ActionDescription"

const GiveBattleForm = ({
  availableAction,
  publicGameState,
  isExpanded,
  setIsExpanded,
  onSubmitSuccess,
}: CustomActionFormProps) => {
  const {
    dialogRef,
    feedback,
    loading,
    openDialog,
    closeDialog,
    handleDialogClose,
    submit,
  } = useCustomActionForm({
    availableAction,
    publicGameState,
    isExpanded,
    setIsExpanded,
    onSubmitSuccess,
  })

  const campaignId = Number(availableAction.context?.["campaign_id"])
  const campaign = publicGameState.campaigns.find((c) => c.id === campaignId)
  const war = publicGameState.wars.find((w) => w.id === campaign?.war)
  const commander = publicGameState.senators.find(
    (s) => s.id === campaign?.commander,
  )
  const masterOfHorse = publicGameState.senators.find(
    (s) => s.id === campaign?.masterOfHorse,
  )

  const legions = publicGameState.legions.filter(
    (l) => l.campaign === campaign?.id,
  )
  const fleets = publicGameState.fleets.filter(
    (f) => f.campaign === campaign?.id,
  )

  // Fleets alone are counted until the enemy navy is beaten (§1.10.12)
  const isNavalBattle = (war?.navalStrength ?? 0) > 0
  const unitStrength = isNavalBattle
    ? fleets.length
    : legions.reduce((sum, l) => sum + (l.veteran ? 2 : 1), 0)

  const combinedMilitary =
    (commander?.military ?? 0) + (masterOfHorse?.military ?? 0)
  const commanderStrength = Math.min(combinedMilitary, unitStrength)
  const warStrength = war
    ? getWarStrengthBreakdown(
        war,
        isNavalBattle ? "naval" : "land",
        publicGameState.wars,
        publicGameState.enemyLeaders,
      ).total
    : 0
  const evilOmens = getEvilOmensLevel(publicGameState.game?.effects ?? [])
  const modifier = unitStrength + commanderStrength - warStrength - evilOmens

  const nullified =
    !!commander?.statesmanName &&
    !!war?.seriesName &&
    SERIES_NULLIFIERS[commander.code] === war.seriesName
  const leaders = war ? getActiveLeaders(war, publicGameState.enemyLeaders) : []
  const disasterNumbers = [
    ...(nullified ? [] : (war?.disasterNumbers ?? [])),
    ...leaders.map((l) => l.disasterNumber),
  ]
  const standoffNumbers = [
    ...(nullified ? [] : (war?.standoffNumbers ?? [])),
    ...leaders.map((l) => l.standoffNumber),
  ]
  const odds = getCombatOdds(modifier, disasterNumbers, standoffNumbers)

  const outcomes: [string, number, string][] = [
    ["Victory", odds.victory, "text-emerald-700"],
    ["Stalemate", odds.stalemate, "text-neutral-700"],
    ["Defeat", odds.defeat, "text-red-700"],
    ["Standoff", odds.standoff, "text-amber-700"],
    ["Disaster", odds.disaster, "text-red-800"],
  ]

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submit({})
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={openDialog}
        className="select-none rounded-md border border-blue-600 bg-white px-4 py-1 text-blue-600 hover:bg-blue-100"
      >
        {availableAction.name}...
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        className="min-w-[24rem] rounded-lg bg-white p-6 shadow-lg"
      >
        <div className="flex flex-col gap-6">
          <div className="flex w-0 min-w-full flex-col gap-4">
            <h3 className="text-xl">{availableAction.name}</h3>
            <ActionDescription
              actionName={availableAction.name}
              context={availableAction.context}
            />
          </div>

          {feedback && (
            <div className="inline-flex rounded-md bg-red-50 px-2 py-1 text-red-600">
              <p>{feedback}</p>
            </div>
          )}

          <div className="flex w-0 min-w-full flex-col gap-4">
            <div className="text-sm">
              <span className="font-semibold">{commander?.displayName}</span>{" "}
              attacks the {war?.name} with{" "}
              {isNavalBattle
                ? `${fleets.length} ${fleets.length === 1 ? "fleet" : "fleets"}`
                : `${legions.length} ${legions.length === 1 ? "legion" : "legions"}`}
              .
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-600">
              <div className="flex justify-between">
                <span>Force strength</span>
                <span className="tabular-nums">
                  {unitStrength + commanderStrength}
                </span>
              </div>
              <div className="flex justify-between">
                <span>War strength</span>
                <span className="tabular-nums">&minus;{warStrength}</span>
              </div>
              {evilOmens > 0 && (
                <div className="flex justify-between">
                  <span>Evil omens</span>
                  <span className="tabular-nums">&minus;{evilOmens}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-blue-200 pt-1 font-semibold">
                <span>Modifier to 3d6</span>
                <span className="tabular-nums">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-neutral-100 p-3 text-sm">
              <div className="font-semibold text-neutral-600">Chances</div>
              {outcomes.map(([label, value, colour]) => (
                <div key={label} className="flex justify-between">
                  <span className={colour}>{label}</span>
                  <span className="tabular-nums text-neutral-600">
                    {value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={closeDialog}
              className="select-none rounded-md border border-neutral-600 px-4 py-1 text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="select-none rounded-md border border-blue-600 px-4 py-1 text-blue-600 hover:bg-blue-100 disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent"
            >
              Attack
            </button>
          </div>
        </div>
      </dialog>
    </form>
  )
}

export default GiveBattleForm
