import Campaign from "@/classes/Campaign"
import PublicGameState from "@/classes/PublicGameState"
import Senator from "@/classes/Senator"
import War from "@/classes/War"
import { SERIES_NULLIFIERS } from "@/data/statesmen"
import { CombatOdds, getCombatOdds } from "@/helpers/combatOdds"
import { getEvilOmensLevel } from "@/helpers/gameEffects"
import { getActiveLeaders, getWarStrengthBreakdown } from "@/helpers/wars"

export interface PendingBattle {
  campaign: Campaign
  war: War
  commander: Senator
  masterOfHorse: Senator | null
  isNaval: boolean
  unitCount: number
  unitStrength: number
  commanderMilitary: number
  commanderStrength: number
  warStrength: number
  evilOmens: number
  modifier: number
  odds: CombatOdds
}

// Mirrors backend/rorapp/helpers/combat_order.py. Wars are fought in the order
// the Senate dispatched the commanders placed last on each of them (1.10.1)
const nextPendingCampaigns = (campaigns: Campaign[]): Campaign[] => {
  const byWar = new Map<number, Campaign[]>()
  for (const campaign of campaigns) {
    byWar.set(campaign.war, [...(byWar.get(campaign.war) ?? []), campaign])
  }
  const lastCampaignId = (warId: number) =>
    Math.max(...(byWar.get(warId) ?? []).map((c) => c.id))
  const orderedWarIds = [...byWar.keys()].sort(
    (a, b) => lastCampaignId(a) - lastCampaignId(b),
  )
  for (const warId of orderedWarIds) {
    const pending = (byWar.get(warId) ?? []).filter((c) => c.pending)
    if (pending.length > 0) return pending.sort((a, b) => a.id - b.id)
  }
  return []
}

// The battle about to be fought, once the commanders have settled who attacks
export const getPendingBattle = (
  publicGameState: PublicGameState,
): PendingBattle | null => {
  const game = publicGameState.game
  if (!game || game.phase !== "combat" || game.subPhase !== "resolution") {
    return null
  }

  const ready = nextPendingCampaigns(publicGameState.campaigns).filter(
    (c) => !c.imminent,
  )
  if (ready.length !== 1) return null
  const campaign = ready[0]

  const commander = publicGameState.senators.find(
    (s) => s.id === campaign.commander,
  )
  const war = publicGameState.wars.find((w) => w.id === campaign.war)
  if (!commander || !war) return null

  // A commander still weighing up a land battle after a naval victory has his
  // own decision to make first
  if (commander.statusItems.includes("considering land battle")) return null

  const masterOfHorse =
    publicGameState.senators.find((s) => s.id === campaign.masterOfHorse) ??
    null
  const legions = publicGameState.legions.filter(
    (l) => l.campaign === campaign.id,
  )
  const fleets = publicGameState.fleets.filter(
    (f) => f.campaign === campaign.id,
  )

  // Fleets alone are counted until the enemy navy is beaten (1.10.12)
  const isNaval = war.navalStrength > 0
  const unitStrength = isNaval
    ? fleets.length
    : legions.reduce((sum, l) => sum + (l.veteran ? 2 : 1), 0)
  const commanderMilitary = commander.military + (masterOfHorse?.military ?? 0)
  const commanderStrength = Math.min(commanderMilitary, unitStrength)
  const warStrength = getWarStrengthBreakdown(
    war,
    isNaval ? "naval" : "land",
    publicGameState.wars,
    publicGameState.enemyLeaders,
  ).total
  const evilOmens = getEvilOmensLevel(game.effects ?? [])
  const modifier = unitStrength + commanderStrength - warStrength - evilOmens

  const nullified =
    !!commander.statesmanName &&
    !!war.seriesName &&
    SERIES_NULLIFIERS[commander.code] === war.seriesName
  const leaders = getActiveLeaders(war, publicGameState.enemyLeaders)

  return {
    campaign,
    war,
    commander,
    masterOfHorse,
    isNaval,
    unitCount: isNaval ? fleets.length : legions.length,
    unitStrength,
    commanderMilitary,
    commanderStrength,
    warStrength,
    evilOmens,
    modifier,
    odds: getCombatOdds(
      modifier,
      [
        ...(nullified ? [] : war.disasterNumbers),
        ...leaders.map((l) => l.disasterNumber),
      ],
      [
        ...(nullified ? [] : war.standoffNumbers),
        ...leaders.map((l) => l.standoffNumber),
      ],
    ),
  }
}
