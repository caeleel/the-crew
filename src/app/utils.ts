import { CardWithPosition } from './game'

export function findWinner(trick: CardWithPosition[]): CardWithPosition {
  const lead = trick[0]
  let toSort = trick.filter((c) => c.card[0] === 's')
  if (toSort.length === 0) {
    toSort = trick.filter((c) => c.card[0] === lead.card[0])
  }

  toSort.sort((a, b) => (a.card < b.card ? 1 : -1))
  return toSort[0]
}
