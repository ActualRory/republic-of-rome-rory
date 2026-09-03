"use client"

import { useEffect, useRef, useState } from "react"

import { BattleRecord } from "@/classes/BattleRecord"
import BattleReport from "@/components/BattleReport"

const BEAT_INTERVAL_MS = 700
const FINAL_BEAT = 5
const AUTO_CLOSE_MS = 3500

interface Props {
  record: BattleRecord
  // A battle opened from the log is a record being inspected, so it is shown
  // whole rather than played out again
  replay: boolean
  // A modal makes the rest of the page inert, so the way out of a backlog of
  // battles has to be offered from inside it
  catchingUp?: boolean
  onSkipToNow?: () => void
  onClose: () => void
}

const BattleOverlay = ({
  record,
  replay,
  catchingUp,
  onSkipToNow,
  onClose,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [beat, setBeat] = useState(replay ? 0 : FINAL_BEAT)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (!replay || beat >= FINAL_BEAT) return
    const timer = setTimeout(() => setBeat((b) => b + 1), BEAT_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [beat, replay])

  // Once the whole battle has been shown it stops demanding attention
  useEffect(() => {
    if (!replay || beat < FINAL_BEAT) return
    const timer = setTimeout(() => dialogRef.current?.close(), AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [beat, replay])

  const handleClick = () => {
    if (beat < FINAL_BEAT) {
      setBeat(FINAL_BEAT)
      return
    }
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className="w-[32rem] max-w-[90vw] animate-overlay-in rounded-lg bg-white p-6 shadow-lg backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-5">
        <BattleReport record={record} beat={beat} size="full" />
        <div className="flex justify-end gap-4">
          {catchingUp && onSkipToNow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                dialogRef.current?.close()
                onSkipToNow()
              }}
              className="select-none rounded-md border border-neutral-600 px-4 py-1 text-neutral-600 hover:bg-neutral-100"
            >
              Skip to now
            </button>
          )}
          <button
            type="button"
            onClick={handleClick}
            className="select-none rounded-md border border-blue-600 px-4 py-1 text-blue-600 hover:bg-blue-100"
          >
            {beat < FINAL_BEAT ? "Skip" : "Continue"}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default BattleOverlay
