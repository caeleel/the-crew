export const cards = [
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9',
  'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9',
  'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9',
  'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9',
  'S1', 'S2', 'S3', 'S4',
] as const

export type CardValue = typeof cards[number]

export type Trick = [CardValue, CardValue, CardValue, CardValue]
export interface Hint {
  card: CardValue
  type: 'top' | 'only' | 'bottom'
}

export type Suit = 'B' | 'P' | 'Y' | 'G'
export type SuitWithSubs = Suit | 'S'