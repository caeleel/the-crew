import { CardValue, Suit, SuitWithSubs } from './cards'

type Comparator = 'more' | 'less' | 'equal' | 'moreCombined'
type PlayerNumArray = [number, number, number]

export interface Mission {
  points: PlayerNumArray
  willWin?: CardValue[]
  wontWinNumbers?: number[]
  wontWinColors?: SuitWithSubs[]
  wontWinCards?: CardValue[]
  willWinWith?: {
    with: number,
    capturing?: number,
  }
  willWinWithSub?: CardValue,
  allGreaterThan?: number
  allLessThan?: number
  totalGreaterThan?: PlayerNumArray
  totalLessThan?: PlayerNumArray
  noneOfTheFirst?: number
  lastNTricks?: number
  firstNTricks?: number
  numTricks?: number
  xIsPublic?: boolean
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
  asManyAs?: [Suit, Suit]
  moreThan?: [Suit, Suit]
}

export const missions: Mission[] = [
  { points: [1, 1, 1], willWin: ['G6'] },
  { points: [1, 1, 1], willWin: ['B4'] },
  { points: [1, 1, 1], willWin: ['P3'] },
  { points: [1, 1, 1], willWin: ['Y1'] },
  { points: [3, 4, 5], willWin: ['B3', 'P3', 'G3', 'Y3'] },
  { points: [3, 4, 5], willWin: ['B9', 'P9', 'G9', 'Y9'] },
  { points: [2, 2, 2], willWin: ['P1', 'G7'] },
  { points: [2, 3, 3], willWin: ['Y9', 'B7'] },
  { points: [2, 2, 3], willWin: ['P8', 'B5'] },
  { points: [2, 2, 3], willWin: ['G5', 'B8'] },
  { points: [2, 2, 3], willWin: ['B6', 'Y7'] },
  { points: [2, 2, 3], willWin: ['P5', 'Y6'] },
  { points: [2, 3, 3], willWin: ['P9', 'Y8'] },
  { points: [3, 3, 3], willWin: ['S1'], wontWinCards: ['S2', 'S3', 'S4'] },
  { points: [3, 3, 3], willWin: ['S2'], wontWinCards: ['S1', 'S3', 'S4'] },
  { points: [1, 1, 1], willWin: ['S3'] },
  { points: [3, 4, 4], willWin: ['G3', 'Y4', 'Y5'] },
  { points: [2, 3, 3], willWin: ['B1', 'B2', 'B3'] },
  { points: [1, 1, 1], wontWinColors: ['S'] },
  { points: [3, 3, 3], wontWinColors: ['Y', 'G'] },
  { points: [3, 3, 3], wontWinColors: ['P', 'B'] },
  { points: [2, 2, 2], wontWinColors: ['P'] },
  { points: [2, 2, 2], wontWinColors: ['Y'] },
  { points: [1, 1, 1], wontWinNumbers: [9] },
  { points: [1, 2, 2], wontWinNumbers: [5] },
  { points: [2, 2, 2], wontWinNumbers: [1] },
  { points: [3, 3, 3], wontWinNumbers: [1, 2, 3] },
  { points: [3, 3, 2], wontWinNumbers: [8, 9] },
  { points: [3, 3, 3], willWinWithSub: 'G9' },
  { points: [3, 3, 3], willWinWithSub: 'P7' },
  { points: [3, 4, 5], willWinWith: { with: 3 } },
  { points: [2, 3, 3], willWinWith: { with: 6 } },
  { points: [2, 3, 4], willWinWith: { with: 5 } },
  { points: [3, 4, 5], willWinWith: { with: 2 } },
  { points: [2, 3, 4], willWinWith: { with: 6, capturing: 6 } },
  { points: [1, 2, 2], willWinWith: { with: 7, capturing: 5 } },
  { points: [3, 4, 5], willWinWith: { with: 4, capturing: 8 } },
  { points: [3, 3, 4], totalLessThan: [24, 24, 24], totalGreaterThan: [21, 21, 21] },
  { points: [3, 3, 4], totalLessThan: [8, 12, 16] },
  { points: [3, 3, 4], totalGreaterThan: [23, 28, 31] },
  { points: [2, 3, 3], allLessThan: 7 },
  { points: [2, 3, 4], allGreaterThan: 5 },
  { points: [2, 2, 3], relativeToCaptain: 'more' },
  { points: [2, 2, 2], relativeToCaptain: 'less' },
  { points: [4, 3, 3], relativeToCaptain: 'equal' },
  { points: [2, 5, 6], oddOrEven: 'even' },
  { points: [2, 4, 5], oddOrEven: 'odd' },
  { points: [2, 3, 3], relativeToOthers: 'more' },
  { points: [2, 2, 3], relativeToOthers: 'less' },
  { points: [3, 4, 5], relativeToOthers: 'moreCombined' },
  { points: [3, 4, 5], finalTrickCapture: 'G2' },
  { points: [3, 4, 5], winNumber: { target: 9, count: 3, exact: false } },
  { points: [3, 4, 5], winNumber: { target: 5, count: 3, exact: false } },
  { points: [3, 4, 4], winNumber: { target: 6, count: 3, exact: true } },
  { points: [2, 2, 2], winNumber: { target: 7, count: 2, exact: false } },
  { points: [2, 3, 3], winNumber: { target: 9, count: 2, exact: true } },
  { points: [3, 4, 4], winSuit: [{ suit: 'S', count: 3, exact: true }] },
  { points: [3, 3, 4], winSuit: [{ suit: 'S', count: 2, exact: true }] },
  { points: [3, 3, 3], winSuit: [{ suit: 'S', count: 1, exact: true }] },
  { points: [3, 3, 4], winSuit: [{ suit: 'P', count: 1, exact: true }] },
  { points: [3, 4, 4], winSuit: [{ suit: 'B', count: 2, exact: true }] },
  { points: [3, 4, 4], winSuit: [{ suit: 'G', count: 2, exact: true }] },
  {
    points: [4, 4, 4], winSuit: [
      { suit: 'P', count: 1, exact: true },
      { suit: 'G', count: 1, exact: true }
    ]
  },
  { points: [2, 3, 3], winSuit: [{ suit: 'P', count: 5, exact: false }] },
  { points: [3, 3, 3], winSuit: [{ suit: 'Y', count: 7, exact: false }] },
  { points: [3, 4, 5], special: 'allInOne' },
  { points: [2, 3, 4], special: 'oneInAll' },
  { points: [2, 3, 3], equalInTrick: ['P', 'B'] },
  { points: [2, 3, 3], equalInTrick: ['G', 'Y'] },
  { points: [4, 3, 3], notOpenWith: ['P', 'Y', 'B'] },
  { points: [2, 1, 1], notOpenWith: ['P', 'G'] },
  { points: [4, 4, 4], asManyAs: ['P', 'Y'] },
  { points: [1, 1, 1], moreThan: ['Y', 'B'] },
  { points: [1, 1, 1], moreThan: ['P', 'G'] },
  { points: [1, 1, 1], firstNTricks: 1 },
  { points: [1, 1, 2], firstNTricks: 2 },
  { points: [2, 3, 4], firstNTricks: 3 },
  { points: [2, 3, 3], lastNTricks: 1 },
  { points: [4, 4, 4], numTricks: 1, lastNTricks: 1 },
  { points: [3, 4, 4], firstNTricks: 1, lastNTricks: 1 },
  { points: [4, 3, 3], numTricks: 1, firstNTricks: 1 },
  { points: [4, 3, 3], numTricks: 0 },
  { points: [3, 2, 2], numTricks: 1 },
  { points: [2, 2, 2], numTricks: 2 },
  { points: [2, 3, 5], numTricks: 4 },
  { points: [4, 3, 3], xIsPublic: false },
  { points: [3, 2, 2], xIsPublic: true },
  { points: [1, 2, 2], noneOfTheFirst: 3 },
  { points: [1, 2, 3], noneOfTheFirst: 4 },
  { points: [2, 3, 3], noneOfTheFirst: 5 },
  { points: [1, 1, 1], nInARow: 2 },
  { points: [2, 3, 4], nInARow: 3 },
  { points: [3, 3, 3], numTricks: 2, nInARow: 2 },
  { points: [3, 3, 4], numTricks: 3, nInARow: 3 },
  { points: [3, 2, 2], notNInARow: 2 },
]
