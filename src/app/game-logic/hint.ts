import { CardValue } from '../types'

export function signalType(card: CardValue, hand: CardValue[]) {
  const suit = card[0]

  let isSmallest = true
  let isBiggest = true
  let isOnly = true

  for (const c of hand) {
    if (c === card) continue

    if (c[0] === suit) {
      isOnly = false
      if (c > card) {
        isBiggest = false
      } else {
        isSmallest = false
      }
    }
  }

  if (isOnly) return 'only'
  else if (isBiggest) return 'top'
  else if (isSmallest) return 'bottom'
  else return null
}
