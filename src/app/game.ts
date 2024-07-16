import { CardValue, Hint } from './cards'
import { Mission } from './missions'

export type SeatKey = 'seat1' | 'seat2' | 'seat3' | 'seat4' | 'seat5'

export interface CardWithPosition {
  card: CardValue
  position: SeatKey
}

type Trick = CardWithPosition[]

export interface Player {
  name: string
  hand: CardValue[]
  missions: Mission[]
  hint: Hint | null
  passesRemaining: number
  tricks: Trick[]
  idx: number
  seat: SeatKey
  guid: string
}

export interface GameState {
  players: Player[]
  activeTrick: Trick
  previousTrick: Trick
  captainSeat: SeatKey
  totalTricks: number
  missions: Mission[]
  numPlayers: number
  whoseTurn: SeatKey
  turnIdx: number
}

export interface ServerGameState {
  seed1: number
  seed2: number
  seed3: number
  seed4: number
  seat1: string
  seat2: string
  seat3: string
  seat4: string
  seat5: string
  meta: {
    target: number
  }
  startingSeats: SeatKey[]
  status: 'started' | 'waiting'
}

function allGuids(serverState: ServerGameState): string[] {
  const firstPart = (x: string) => x.split(':')[0]

  const { seat1, seat2, seat3, seat4, seat5 } = serverState
  return [seat1, seat2, seat3, seat4, seat5].map(firstPart).filter((x) => !!x)
}

export function numJoined(serverState: ServerGameState) {
  return allGuids(serverState).length
}

export function joined(guid: string, serverState: ServerGameState) {
  return !!guid && allGuids(serverState).includes(guid)
}
