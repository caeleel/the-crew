export const cards = [
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
  'P9',
  'Y1',
  'Y2',
  'Y3',
  'Y4',
  'Y5',
  'Y6',
  'Y7',
  'Y8',
  'Y9',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  's1',
  's2',
  's3',
  's4', // lowercase to sort last //
] as const

export type CardValue = (typeof cards)[number]

export interface Hint {
  card: CardValue
  type: 'top' | 'only' | 'bottom'
  played: boolean
}

export type Suit = 'B' | 'P' | 'Y' | 'G'
export type SuitWithSubs = Suit | 's'

export type MissionStatus = 'pass' | 'fail' | undefined

type Comparator = 'more' | 'fewer' | 'as many' | 'moreCombined'
type PlayerNumArray = [number, number, number]

export interface Mission {
  points: PlayerNumArray
  id: string
  status?: MissionStatus

  willWin?: CardValue[]
  wontWinNumbers?: number[]
  wontWinColors?: SuitWithSubs[]
  wontWinCards?: CardValue[]
  willWinWith?: {
    with: number
    capturing?: number
  }
  willWinWithSub?: CardValue
  allCardsGreaterOrLessThan?: {
    value: number
    lessOrGreater: '>' | '<'
  }
  totalGreaterThan?: PlayerNumArray
  totalLessThan?: PlayerNumArray
  noneOfTheFirst?: number
  lastNTricks?: number
  firstNTricks?: number
  numTricks?: number
  xIsPublic?: boolean
  x?: number
  secretX?: number
  nInARow?: number
  notNInARow?: number
  relativeToOthers?: Comparator
  relativeToCaptain?: Comparator
  oddOrEven?: 'odd' | 'even'
  winNumber?: {
    target: number
    count: number
    exact: boolean
  }
  winSuit?: {
    suit: SuitWithSubs
    count: number
    exact: boolean
  }[]
  finalTrickCapture?: CardValue
  special?: 'allInOne' | 'oneInAll'
  equalInTrick?: [Suit, Suit]
  notOpenWith?: Suit[]
  comparison?: { suits: [Suit, Suit]; comparator: '>' | '=' }
}

export const seats = ['seat1', 'seat2', 'seat3', 'seat4', 'seat5'] as const
export type SeatKey = (typeof seats)[number]

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
  undoUsed: boolean
  succeeded: boolean
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

export interface CardWithPosition {
  card: CardValue
  position: SeatKey
}

export interface Trick {
  cards: CardWithPosition[]
  index: number
}

export type Emote = 'distress' | 'winnable' | 'trust' | 'none'

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
  emote?: Emote
}

export interface MissionLog {
  seed1: number
  seed2: number
  seed3: number
  seed4: number
  success: boolean
  completed: boolean
  undo_used: boolean
  meta: { target: number }
  created_at: number
  updated_at: number
  moves: string[]
  players: {
    [guid: string]: {
      seat: string
      name: string
    }
  }
}
