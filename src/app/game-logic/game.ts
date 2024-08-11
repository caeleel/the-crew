import { atom, createStore } from 'jotai'
import { missions } from '../components/missions'
import { applyMove, Move, parseMove, seatToIdx } from './move'
import { setSeeds, shuffle } from '../lib/rand'
import { getLocalStorage } from '../lib/local-storage'
import {
  cards,
  GameState,
  Mission,
  Player,
  SeatKey,
  ServerGameState,
} from '../types'

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
  succeeded: false,
})

let name = getLocalStorage('name') || ''
export const nameAtom = atom(name)

export type Settings = { validateMissions: boolean }

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

let moves: Move[] = []
export let rawMoves: string[] = []

export function targetPts(serverState: ServerGameState) {
  return serverState.meta.target || 12
}

export function gameComplete(gameState: GameState) {
  return gameState.totalTricks <= gameState.activeTrick.index
}

function allocateMissions(missions: Mission[], players: number) {
  const target = targetPts(atomStore.get(serverStateAtom))

  let current = 0
  const chosen: Mission[] = []
  let idx = 0
  while (current < target) {
    const points = missions[idx].points[players - 3]
    if (current + points <= target) {
      chosen.push(missions[idx])
      current += points
    }
    idx++
  }

  return chosen
}

export function initializeGameState(gameState: GameState) {
  const serverState = atomStore.get(serverStateAtom)
  const { seed1, seed2, seed3, seed4 } = serverState
  setSeeds(seed1, seed2, seed3, seed4)

  const shuffledCards = shuffle(cards)
  const shuffledMissions = shuffle(missions)

  const activeSeats = serverState.startingSeats
  const totalTricks = Math.floor(cards.length / activeSeats.length)
  const players: Player[] = []

  gameState.activeTrick = {
    cards: [],
    index: 0,
  }
  gameState.previousTrick = {
    cards: [],
    index: -1,
  }
  gameState.totalTricks = totalTricks
  gameState.missions = allocateMissions(shuffledMissions, activeSeats.length)
  gameState.players = players
  gameState.numPlayers = activeSeats.length
  gameState.undoUsed = false
  gameState.succeeded = false

  let cardIdx = 0
  let captainFound = false
  for (let i = 1; i <= 5; i++) {
    const seat = `seat${i}` as SeatKey
    const [currGuid, name] = serverState[seat].split(':', 2)

    let endIdx = cardIdx + totalTricks
    const player: Player = {
      ...cloneEmptyPlayer(seat),
      name: name || '',
      idx: i,
      guid: currGuid,
      hand: currGuid ? shuffledCards.slice(cardIdx, endIdx) : [],
    }

    if (player.hand.includes('s4')) {
      captainFound = true
      gameState.captainSeat = seat
      gameState.whoseTurn = seat
      gameState.turnIdx = i - 1

      if (activeSeats.length === 3) {
        player.hand.push(shuffledCards[endIdx])
        endIdx++
      }
    }

    if (currGuid) {
      cardIdx = endIdx
      player.hand.sort()
    }

    players.push(player)
  }

  if (!captainFound) {
    gameState.captainSeat = serverState.startingSeats[0]
    gameState.whoseTurn = gameState.captainSeat
    gameState.turnIdx = seatToIdx(gameState.captainSeat)
    const captain = gameState.players[gameState.turnIdx]
    captain.hand.push('s4')
    console.log('appointed captain', captain)
  }

  console.log('game-state', gameState)

  const playsUntilUndo = moves.map(() => 0)
  let playCounter = gameState.numPlayers + 1
  for (let i = moves.length - 1; i >= 0; i--) {
    const move = moves[i]
    if (move.type === 'undo') {
      playCounter = 0
    }

    if (move.type === 'play') {
      playCounter++
    }

    playsUntilUndo[i] = playCounter
  }

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    applyMove(move, gameState, serverState, playsUntilUndo[i])
  }

  atomStore.set(gameStateAtom, gameState)
}

let needsInitialize = false

export function handleMsg(msg: any) {
  console.log(`Received msg type: ${msg.type}`)
  switch (msg.type) {
    case 'pong': {
      break
    }
    case 'game': {
      const rawState = msg.gameState
      const {
        seed1,
        seed2,
        seed3,
        seed4,
        status,
        seat1,
        seat2,
        seat3,
        seat4,
        seat5,
      } = rawState
      const startingSeats =
        rawState.startingSeats === '' ? [] : rawState.startingSeats.split(',')

      const serverState = atomStore.get(serverStateAtom)
      if (status === 'started' && serverState.status === 'waiting') {
        needsInitialize = true
      }
      const newServerState: ServerGameState = {
        seed1: Number(seed1),
        seed2: Number(seed2),
        seed3: Number(seed3),
        seed4: Number(seed4),
        status,
        seat1,
        seat2,
        seat3,
        seat4,
        seat5,
        meta: rawState.meta ? JSON.parse(rawState.meta) : {},
        startingSeats,
      }
      atomStore.set(serverStateAtom, newServerState)

      const gameState = { ...atomStore.get(gameStateAtom) }
      for (let i = 0; i < 5; i++) {
        const seatKey = `seat${i + 1}` as SeatKey
        const [guid, name] = newServerState[seatKey].split(':', 2)
        gameState.players[i].name = name
        gameState.players[i].guid = guid
      }

      if (needsInitialize) {
        initializeGameState(gameState)
        needsInitialize = false
      }
      break
    }
    case 'moves': {
      rawMoves = msg.moves
      moves = msg.moves.map((msg: string) => parseMove(msg))
      if (moves.length) {
        needsInitialize = true
      }
      break
    }
    case 'move': {
      const move = `${msg.guid}:${msg.move}`
      const parsed = parseMove(move)
      if (parsed) {
        moves.push(parsed)
        rawMoves.push(move)
        const gameState = { ...atomStore.get(gameStateAtom) }

        if (parsed.type === 'undo') {
          initializeGameState(gameState)
        } else {
          applyMove(parsed, gameState, atomStore.get(serverStateAtom))
          atomStore.set(gameStateAtom, gameState)
        }
      }
    }
  }
}
