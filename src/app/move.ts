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

interface EmoteMove {
  type: 'emote'
  emote: 'distress'
  guid: string
}

export type Move = PlayMove | HintMove | EmoteMove

export function parseMove(move: string): Move | null {
  const parts = move.split(':')
  const guid = parts[0]
  switch (parts[1]) {
    case 'p':
      return {
        type: 'play',
        guid,
        card: parts[2] as CardValue
      }
    case 'h':
      return {
        type: 'hint',
        guid,
        hint: {
          card: parts[2] as CardValue,
          type: parts[3] as 'top' | 'only' | 'bottom',
        }
      }
    case 'e':
      return {
        type: 'emote',
        guid,
        emote: parts[2] as 'distress',
      }
    default:
      return null
  }
}

export function serializeMove(move: Move): string {
  switch (move.type) {
    case 'play':
      return `p:${move.card}`
    case 'hint':
      return `h:${move.hint.card}:${move.hint.type}`
    case 'emote':
      return `e:${move.emote}`
  }
}