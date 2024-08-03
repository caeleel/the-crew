import { CardValue, Hint } from './cards'

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
  emote: 'distress'
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
        emote: parts[2] as 'distress',
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
