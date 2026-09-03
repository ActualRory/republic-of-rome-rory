"use client"

import { useEffect, useRef, useState } from "react"

import { parseBattleRecord } from "@/classes/BattleRecord"
import Log from "@/classes/Log"
import PublicGameState from "@/classes/PublicGameState"
import BattleOverlay from "@/components/BattleOverlay"
import BattleReport from "@/components/BattleReport"
import { formatElapsedDate } from "@/helpers/date"
import useLogPlayback from "@/hooks/useLogPlayback"

interface Props {
  publicGameState: PublicGameState
}

interface LogGroup {
  key: string
  turn: number
  phase: string
  logs: Log[]
}

// Entries carry their turn and phase individually, so they are grouped under a
// single heading rather than repeating it on every line
const groupLogs = (logs: Log[]): LogGroup[] => {
  const groups: LogGroup[] = []
  for (const log of logs) {
    const last = groups[groups.length - 1]
    if (last && last.turn === log.turn && last.phase === log.phase) {
      last.logs.push(log)
    } else {
      groups.push({
        key: `${log.turn}-${log.phase}-${log.id}`,
        turn: log.turn,
        phase: log.phase,
        logs: [log],
      })
    }
  }
  return groups
}

const LogList = ({ publicGameState }: Props) => {
  const [timezone, setTimezone] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const { visibleLogs, pendingCount, battle, skip, dismissBattle } =
    useLogPlayback(publicGameState.logs)

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [setTimezone])

  // Force re-render every 5 seconds to keep elapsed times fresh
  const [, setRefreshKey] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom when logs change, only if user hasn't scrolled up
  useEffect(() => {
    const el = scrollRef.current
    if (el && isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [visibleLogs.length])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distanceFromBottom < 50
  }

  const battleRecord = battle ? parseBattleRecord(battle.data) : null

  return (
    <div
      className="relative flex shrink-0 flex-col overflow-hidden border-l border-neutral-300"
      style={{ width: "clamp(485px, calc(100vw - 795px), 600px)" }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 grow flex-col overflow-y-auto px-10 py-6"
      >
        <div className="flex-1" />
        {groupLogs(visibleLogs).map((group) => (
          <div key={group.key} className="flex flex-col">
            <div className="sticky top-0 z-10 bg-white py-1 text-sm text-neutral-600">
              Turn {group.turn} &middot;{" "}
              <span className="capitalize">{group.phase} phase</span>
            </div>
            <div className="flex flex-col gap-4 pb-4">
              {group.logs.map((log) => {
                const record =
                  log.category === "battle" ? parseBattleRecord(log.data) : null
                return (
                  <div
                    key={log.id}
                    className="flex animate-log-entry flex-col items-baseline gap-x-4"
                  >
                    <div className="flex w-full justify-end text-sm text-neutral-600">
                      {formatElapsedDate(log.createdOn, timezone)}
                    </div>
                    {record ? (
                      <div className="w-full rounded border border-neutral-300 bg-neutral-50 p-3">
                        <BattleReport record={record} />
                      </div>
                    ) : (
                      <div className="w-full">{log.text}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-4 right-10 select-none rounded-md border border-neutral-400 bg-white px-3 py-1 text-sm text-neutral-600 shadow-sm hover:bg-neutral-100"
        >
          Skip {pendingCount}
        </button>
      )}

      {battleRecord && (
        <BattleOverlay record={battleRecord} onClose={dismissBattle} />
      )}
    </div>
  )
}

export default LogList
