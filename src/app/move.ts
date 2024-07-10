import { CardValue, Hint } from './cards'

interface PlayMove {
  type: 'play'
  guid: string
  card: CardValue
}

interface HintMove {
  type: 'hint'
  guid: string
  hint: Hint
}

interface DraftMove {
  type: 'draft'
  guid: string
  id: string
}

interface EmoteMove {
  type: 'emote'
  emote: 'distress'
  guid: string
}

export type Move = PlayMove | HintMove | DraftMove | EmoteMove

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
      }
    default:
      return null
  }
}
