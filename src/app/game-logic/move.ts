import {
  GameState,
  SeatKey,
  ServerGameState,
  CardValue,
  Hint,
  Emote,
} from '../types'
import { signalType } from './hint'
import { updateMissionStatuses } from './validate'
import { findWinner } from '../lib/utils'
import { guid } from '../lib/ws'
import { upsertGame } from '../lib/api'
import { rawMoves } from './game'

interface PlayMove {
  type: 'play'
  guid: string
  card: CardValue
}

export interface HintMove {
  type: 'hint'
  guid: string
  hint: Hint | null
}

interface DraftMove {
  type: 'draft'
  guid: string
  id: string
  x?: number
}

interface EmoteMove {
  type: 'emote'
  emote: Emote
  guid: string
}

interface UndoMove {
  type: 'undo'
  guid: string
}

export type Move = PlayMove | HintMove | DraftMove | EmoteMove | UndoMove

export function parseMove(move: string): Move | null {
  const parts = move.split(':')
  const guid = parts[0]
  switch (parts[1]) {
    case 'p':
      return {
        type: 'play',
        guid,
        card: parts[2] as CardValue,
      }
    case 'h':
      if (parts[2] === 'cancel') {
        return { type: 'hint', guid, hint: null }
      }
      return {
        type: 'hint',
        guid,
        hint: {
          card: parts[2] as CardValue,
          type: parts[3] as 'top' | 'only' | 'bottom',
          played: false,
        },
      }
    case 'e':
      return {
        type: 'emote',
        guid,
        emote: parts[2] as Emote,
      }
    case 'd':
      return {
        type: 'draft',
        guid,
        id: parts[2],
        x: parts[3] ? Number(parts[3]) : undefined,
      }
    case 'u':
      return {
        type: 'undo',
        guid,
      }
    default:
      return null
  }
}

export let pendingHints: {
  [guid: string]: Hint | null
} = {}

export function seatToIdx(seat: SeatKey): number {
  return Number(seat[4]) - 1
}

export function flushMoveQueue(
  gameState: GameState,
  serverState: ServerGameState,
) {
  for (const guid of Object.keys(pendingHints)) {
    const hint = pendingHints[guid]
    applyMove({ type: 'hint', guid, hint }, gameState, serverState)
  }
  pendingHints = {}
}

export function applyMove(
  move: Move,
  gameState: GameState,
  serverState: ServerGameState,
  playsUntilUndo?: number,
) {
  if (serverState.status !== 'started') {
    return
  }

  const activePlayer = gameState.players[gameState.turnIdx]
  const seatIdx = serverState.startingSeats.indexOf(gameState.whoseTurn)
  if (seatIdx < 0) {
    throw new Error('Could not find active seat in seating chart')
  }
  const nextSeatIdx = (seatIdx + 1) % gameState.numPlayers
  const nextSeat = serverState.startingSeats[nextSeatIdx]

  function rotatePlayer() {
    gameState.whoseTurn = nextSeat
    gameState.turnIdx = seatToIdx(nextSeat)
  }

  if (move.type === 'emote') {
    const emotePlayer = gameState.players.find((p) => p.guid === move.guid)
    if (emotePlayer) {
      emotePlayer.emote = move.emote
    }
    return
  }

  if (gameState.missions.length) {
    if (move.type === 'hint') {
      pendingHints[move.guid] = move.hint
      return
    }

    if (move.type !== 'draft') {
      return
    }

    if (move.id === 'pass') {
      activePlayer.passesRemaining--
      rotatePlayer()
      return
    }

    const missionIdx = gameState.missions.findIndex((m) => m.id === move.id)
    if (missionIdx < 0) {
      return
    }

    const mission = { ...gameState.missions.splice(missionIdx, 1)[0] }
    if (move.x !== undefined) {
      mission.secretX = move.x
      if (mission.xIsPublic || activePlayer.guid === guid) {
        mission.x = move.x
      }
    }
    activePlayer.missions.push(mission)
    if (gameState.missions.length) {
      rotatePlayer()
    } else {
      gameState.whoseTurn = gameState.captainSeat
      gameState.turnIdx = seatToIdx(gameState.captainSeat)
      flushMoveQueue(gameState, serverState)
    }
    return
  }

  if (move.type === 'hint') {
    if (gameState.activeTrick.cards.length > 0) {
      pendingHints[move.guid] = move.hint
      return
    }

    const hintGuid = move.guid
    const player = gameState.players.find((p) => p.guid === hintGuid)
    if (!player) {
      return
    }

    if (move.hint) {
      if (!player.hand.includes(move.hint.card)) return
      const type = signalType(move.hint.card, player.hand)
      if (!type) return
      move.hint.type = type
    }

    player.hint = move.hint
    return
  }

  if (move.type === 'play') {
    if (playsUntilUndo !== undefined) {
      if (gameState.activeTrick.cards.length === 0) {
        if (playsUntilUndo <= gameState.numPlayers) {
          return
        }
      }
    }

    gameState.activeTrick.cards.push({
      card: move.card,
      position: activePlayer.seat,
    })
    activePlayer.hand.splice(activePlayer.hand.indexOf(move.card), 1)
    if (activePlayer.hint?.card === move.card) {
      activePlayer.hint.played = true
    }

    if (gameState.activeTrick.cards.length === gameState.numPlayers) {
      const winnerCard = findWinner(gameState.activeTrick.cards)
      const winnerIdx = seatToIdx(winnerCard.position)
      const winner = gameState.players[winnerIdx]
      winner.tricks.push(gameState.activeTrick)
      gameState.previousTrick = { ...gameState.activeTrick }
      gameState.activeTrick = {
        cards: [],
        index: gameState.activeTrick.index + 1,
      }
      gameState.turnIdx = winnerIdx
      gameState.whoseTurn = winner.seat
      flushMoveQueue(gameState, serverState)
      updateMissionStatuses(gameState)

      if (gameState.activeTrick.index === gameState.totalTricks) {
        if (winner.guid === guid) {
          upsertGame(serverState, { ...gameState, completed: true }, rawMoves)
        }
      }
    } else {
      rotatePlayer()
    }
    return
  }

  if (move.type === 'undo') {
    gameState.undoUsed = true
    return
  }
}
