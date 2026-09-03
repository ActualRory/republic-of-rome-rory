import { useEffect, useRef, useState } from "react"

import Log from "@/classes/Log"

// Entries are released one at a time so a phase reads as a sequence of events
// rather than appearing whole
const ENTRY_INTERVAL_MS = 450
const BATTLE_INTERVAL_MS = 900

// A burst this large means a reconnect or a spectator joining mid-cascade, not
// a phase unfolding, so it is shown immediately
const MAX_PLAYBACK_ENTRIES = 15

interface Playback {
  visibleLogs: Log[]
  pendingCount: number
  battle: Log | null
  skip: () => void
  dismissBattle: () => void
}

const useLogPlayback = (logs: Log[]): Playback => {
  const [revealedId, setRevealedId] = useState<number | null>(null)
  const [battle, setBattle] = useState<Log | null>(null)
  const seenBattleIds = useRef<Set<number>>(new Set())
  const baseline = useRef<number | null>(null)

  const ordered = [...logs].sort((a, b) => a.id - b.id)
  const latestId = ordered.length > 0 ? ordered[ordered.length - 1].id : null

  const orderedRef = useRef<Log[]>(ordered)
  orderedRef.current = ordered

  // The log this component first renders is the game's history, not news, so it
  // is never played back. A game with no history yet starts from zero
  if (baseline.current === null) {
    baseline.current = latestId ?? 0
    ordered.forEach((log) => seenBattleIds.current.add(log.id))
  }

  const cutoff = revealedId ?? baseline.current
  const visibleLogs = ordered.filter(
    (log) => log.id <= cutoff && log.id !== battle?.id,
  )
  const pending = ordered.filter((log) => log.id > cutoff)

  const nextId = pending.length > 0 ? pending[0].id : null
  const nextIsBattle = pending.length > 0 && pending[0].category === "battle"
  const tooManyPending = pending.length > MAX_PLAYBACK_ENTRIES

  useEffect(() => {
    if (nextId === null || battle !== null) return

    if (tooManyPending) {
      setRevealedId(latestId)
      return
    }

    const delay = nextIsBattle ? BATTLE_INTERVAL_MS : ENTRY_INTERVAL_MS
    const timer = setTimeout(() => setRevealedId(nextId), delay)
    return () => clearTimeout(timer)
  }, [nextId, nextIsBattle, tooManyPending, latestId, battle])

  // A battle is the one entry that interrupts, and only while it is still news
  const visibleIds = visibleLogs.map((log) => log.id).join(",")

  useEffect(() => {
    const unseen = orderedRef.current.find(
      (log) =>
        log.id <= cutoff &&
        log.category === "battle" &&
        !seenBattleIds.current.has(log.id),
    )
    if (!unseen) return
    seenBattleIds.current.add(unseen.id)
    setBattle(unseen)
  }, [visibleIds, cutoff])

  const skip = () => setRevealedId(latestId)
  const dismissBattle = () => setBattle(null)

  return {
    visibleLogs,
    pendingCount: pending.length,
    battle,
    skip,
    dismissBattle,
  }
}

export default useLogPlayback
