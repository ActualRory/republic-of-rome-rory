const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

interface Props {
  value: number
  size?: "sm" | "lg"
}

const Die = ({ value, size = "lg" }: Props) => {
  const pips = PIP_LAYOUTS[value]
  const box = size === "lg" ? "h-11 w-11 p-1.5" : "h-7 w-7 p-1"
  const pip = size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5"

  // A face outside 1–6 comes from a total no combination of dice could produce,
  // so it is shown as a number rather than pips
  if (!pips) {
    return (
      <div
        className={`${box} flex items-center justify-center rounded-md border border-neutral-400 bg-white font-semibold tabular-nums`}
      >
        {value}
      </div>
    )
  }

  return (
    <div
      className={`${box} grid grid-cols-3 grid-rows-3 rounded-md border border-neutral-400 bg-white shadow-sm`}
      aria-label={`Die showing ${value}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && (
            <div className={`${pip} rounded-full bg-neutral-800`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default Die
