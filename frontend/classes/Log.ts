export interface LogData {
  id: number
  turn: number
  phase: string
  created_on: string
  text: string
  category: string
  data: Record<string, unknown>
}

class Log {
  id: number
  turn: number
  phase: string
  createdOn: string
  text: string
  category: string
  data: Record<string, unknown>

  constructor(data: LogData) {
    this.id = data.id
    this.turn = data.turn
    this.phase = data.phase
    this.createdOn = data.created_on
    this.text = data.text
    this.category = data.category ?? ""
    this.data = data.data ?? {}
  }
}

export default Log
