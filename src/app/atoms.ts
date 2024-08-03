import { atom, createStore } from 'jotai'
import { GameState, Player, SeatKey, ServerGameState, Settings } from './game'
import { getLocalStorage } from './local-storage'

export const emptyPlayer: Player = {
  name: '',
  hand: [],
  missions: [],
  hint: null,
  tricks: [],
  idx: 0,
  passesRemaining: 2,
  guid: '',
  seat: 'seat1',
}

export function cloneEmptyPlayer(seat: SeatKey) {
  return { ...emptyPlayer, seat, hand: [], missions: [], tricks: [] }
}

export const atomStore = createStore()
export const serverStateAtom = atom<ServerGameState>({
  seed1: 0,
  seed2: 0,
  seed3: 0,
  seed4: 0,
  seat1: '',
  seat2: '',
  seat3: '',
  seat4: '',
  seat5: '',
  meta: {
    target: 12,
  },
  startingSeats: [],
  status: 'waiting',
})
export const gameStateAtom = atom<GameState>({
  players: [
    cloneEmptyPlayer('seat1'),
    cloneEmptyPlayer('seat2'),
    cloneEmptyPlayer('seat3'),
    cloneEmptyPlayer('seat4'),
    cloneEmptyPlayer('seat5'),
  ],
  activeTrick: {
    cards: [],
    index: 0,
  },
  previousTrick: {
    cards: [],
    index: -1,
  },
  numPlayers: 0,
  captainSeat: 'seat1',
  missions: [],
  whoseTurn: 'seat1',
  turnIdx: 0,
  totalTricks: 0,
  undoUsed: false,
})

let name = getLocalStorage('name') || ''
export const nameAtom = atom(name)
