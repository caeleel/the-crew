import { CardWithPosition, SeatKey, ServerGameState } from './types'

export function findWinner(trick: CardWithPosition[]): CardWithPosition {
  const lead = trick[0]
  let toSort = trick.filter((c) => c.card[0] === 's')
  if (toSort.length === 0) {
    toSort = trick.filter((c) => c.card[0] === lead.card[0])
  }

  toSort.sort((a, b) => (a.card < b.card ? 1 : -1))
  return toSort[0]
}

export function pickSeat(serverState: ServerGameState) {
  const available: SeatKey[] = []
  for (let i = 1; i <= 5; i++) {
    const seat = `seat${i}` as SeatKey
    if (!serverState[seat]) {
      available.push(seat)
    }
  }

  const idx = Math.floor(Math.random() * available.length)
  return available[idx]
}
