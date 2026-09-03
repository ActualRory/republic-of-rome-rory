import { useEffect, useRef, useState } from "react"

import Log from "@/classes/Log"

// Entries are released one at a time so a phase reads as a sequence of events
// rather than appearing whole
const ENTRY_INTERVAL_MS = 450
const BATTLE_INTERVAL_MS = 900

// Replaying what was missed runs faster than watching it happen live
const CATCHUP_INTERVAL_MS = 180

// A player who has been away for days does not sit through everything. The rest
// stays in the log to scroll back through, it just is not replayed
const MAX_CATCHUP_ENTRIES = 40

const storageKey = (gameId: number) => `ror.lastSeenLog.${gameId}`

const readWatermark = (gameId: number): number | null => {
  try {
    const stored = window.localStorage.getItem(storageKey(gameId))
    return stored === null ? null : Number(stored)
  } catch {
    return null
  }
}

const writeWatermark = (gameId: number, id: number): void => {
  try {
    window.localStorage.setItem(storageKey(gameId), String(id))
  } catch {
    // A browser refusing storage just means no catch-up next time
  }
}

interface Playback {
  visibleLogs: Log[]
  pendingCount: number
  isCatchingUp: boolean
  battle: Log | null
  // True while the battle is landing now, false when a record is being inspected
  battleIsReplay: boolean
  skip: () => void
  showBattle: (log: Log) => void
  dismissBattle: () => void
}

const useLogPlayback = (logs: Log[], gameId?: number): Playback => {
  const [revealedId, setRevealedId] = useState<number | null>(null)
  const [battle, setBattle] = useState<Log | null>(null)
  const [replayingBattle, setReplayingBattle] = useState(false)
  const seenBattleIds = useRef<Set<number>>(new Set())
  const baseline = useRef<number | null>(null)
  const backlogTop = useRef<number>(0)

  const ordered = [...logs].sort((a, b) => a.id - b.id)
  const latestId = ordered.length > 0 ? ordered[ordered.length - 1].id : null

  const orderedRef = useRef<Log[]>(ordered)
  orderedRef.current = ordered

  // Where playback resumes from: what this player last watched, bounded so a
  // long absence does not replay the whole game. A player who has never opened
  // this game starts live rather than watching it from the beginning
  if (baseline.current === null && gameId !== undefined) {
    const stored = readWatermark(gameId)
    if (stored === null) {
      baseline.current = latestId ?? 0
    } else {
      const firstUnseen = ordered.findIndex((log) => log.id > stored)
      const startIndex =
        firstUnseen === -1
          ? ordered.length
          : Math.max(firstUnseen, ordered.length - MAX_CATCHUP_ENTRIES)
      baseline.current = startIndex === 0 ? 0 : ordered[startIndex - 1].id
    }
    backlogTop.current = latestId ?? 0
    ordered
      .filter((log) => log.id <= (baseline.current ?? 0))
      .forEach((log) => seenBattleIds.current.add(log.id))
  }

  const cutoff = revealedId ?? baseline.current ?? latestId ?? 0
  const visibleLogs = ordered.filter(
    (log) => log.id <= cutoff && !(replayingBattle && log.id === battle?.id),
  )
  const pending = ordered.filter((log) => log.id > cutoff)
  const isCatchingUp = cutoff < backlogTop.current

  const nextId = pending.length > 0 ? pending[0].id : null
  const nextIsBattle = pending.length > 0 && pending[0].category === "battle"

  useEffect(() => {
    if (nextId === null || battle !== null) return
    const delay = isCatchingUp
      ? CATCHUP_INTERVAL_MS
      : nextIsBattle
        ? BATTLE_INTERVAL_MS
        : ENTRY_INTERVAL_MS
    const timer = setTimeout(() => setRevealedId(nextId), delay)
    return () => clearTimeout(timer)
  }, [nextId, nextIsBattle, isCatchingUp, battle])

  // A battle interrupts, whether it is happening now or being caught up on
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
    setReplayingBattle(true)
  }, [visibleIds, cutoff])

  useEffect(() => {
    if (gameId !== undefined && cutoff > 0) writeWatermark(gameId, cutoff)
  }, [gameId, cutoff])

  const skip = () => {
    setRevealedId(latestId)
    setBattle(null)
    setReplayingBattle(false)
    orderedRef.current.forEach((log) => seenBattleIds.current.add(log.id))
  }

  // Opening a battle from the log is inspecting a record, not watching it land
  const showBattle = (log: Log) => {
    setBattle(log)
    setReplayingBattle(false)
  }

  const dismissBattle = () => {
    setBattle(null)
    setReplayingBattle(false)
  }

  return {
    visibleLogs,
    pendingCount: pending.length,
    isCatchingUp,
    battle,
    battleIsReplay: replayingBattle,
    skip,
    showBattle,
    dismissBattle,
  }
}

export default useLogPlayback
