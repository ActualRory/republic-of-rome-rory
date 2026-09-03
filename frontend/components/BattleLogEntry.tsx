"use client"

import { BattleRecord } from "@/classes/BattleRecord"

const RESULT_STYLES: Record<string, string> = {
  victory: "border-emerald-600 text-emerald-700",
  stalemate: "border-neutral-500 text-neutral-700",
  defeat: "border-red-600 text-red-700",
  standoff: "border-amber-600 text-amber-700",
  disaster: "border-red-700 text-red-800",
}

interface Props {
  record: BattleRecord
  onOpen: () => void
}

const BattleLogEntry = ({ record, onOpen }: Props) => (
  <button
    type="button"
    onClick={onOpen}
    className="group flex w-full items-baseline gap-2 rounded border border-transparent px-1 py-0.5 text-left hover:border-neutral-300 hover:bg-neutral-50"
  >
    <span
      className={`shrink-0 rounded border px-1.5 text-xs font-semibold uppercase tracking-wide ${RESULT_STYLES[record.result]}`}
    >
      {record.result}
    </span>
    <span className="min-w-0">
      {record.commander} against the {record.war}
      <span className="ml-2 whitespace-nowrap text-sm text-neutral-500 group-hover:underline">
        View battle
      </span>
    </span>
  </button>
)

export default BattleLogEntry
