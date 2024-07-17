import { Button } from './button'

export const cards = [
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
  'P9',
  'Y1',
  'Y2',
  'Y3',
  'Y4',
  'Y5',
  'Y6',
  'Y7',
  'Y8',
  'Y9',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  's1',
  's2',
  's3',
  's4', // lowercase to sort last //
] as const

export type CardValue = (typeof cards)[number]

export function getSuit(cardValue: CardValue): SuitWithSubs {
  return cardValue[0] as Suit
}
export function getNumber(cardValue: CardValue): number {
  return parseInt(cardValue[1])
}
export function isSub(cardValue: CardValue): boolean {
  return getSuit(cardValue) === 's'
}

export interface Hint {
  card: CardValue
  type: 'top' | 'only' | 'bottom'
  played: boolean
}

export type Suit = 'B' | 'P' | 'Y' | 'G'
export type SuitWithSubs = Suit | 's'

const suitToBg = {
  Y: 'bg-amber-300',
  P: 'bg-red-300',
  G: 'bg-green-300',
  B: 'bg-sky-300',
  s: 'bg-black',
}

export function Signal({ hint }: { hint: Hint | null }) {
  if (!hint) {
    return <div>🟢</div>
  }

  if (hint.played) {
    return <div>🔴</div>
  }

  let symbol = '❄️'
  if (hint.type === 'top') {
    symbol = '⬆️'
  } else if (hint.type === 'bottom') {
    symbol = '⬇️'
  }

  return (
    <div className="flex">
      <Card card={hint.card} showNumber />
      <div>{symbol}</div>
    </div>
  )
}

export function SignalButton({
  pendingSignal,
  signaling,
  startSignaling,
  cancelSignal,
}: {
  pendingSignal: Hint | null
  signaling: boolean
  startSignaling: () => void
  cancelSignal: () => void
}) {
  const status = pendingSignal
    ? 'Pending signal...'
    : signaling
      ? 'Signal a card...'
      : ''

  return (
    <>
      {status && <div className="text-sm text-slate-400">{status}</div>}
      <Button
        small
        onClick={() => {
          if (signaling || pendingSignal) {
            cancelSignal()
          } else {
            startSignaling()
          }
        }}
      >
        {signaling || pendingSignal ? 'Cancel' : 'Signal'}
      </Button>
    </>
  )
}

export function CardNumber({ n }: { n: number }) {
  return (
    <div className="border-2 rounded-sm border-white text-white text-xs font-black drop-shadow">
      <div className="w-5 h-5 flex items-center justify-center bg-amber-500">
        <div>{n}</div>
      </div>
    </div>
  )
}

export function Card({
  card,
  big,
  showNumber,
  multi,
  showBack,
  multiplier,
  highlight,
}: {
  card: CardValue
  big?: boolean
  showNumber?: boolean
  multi?: boolean
  showBack?: boolean
  multiplier?: number
  highlight?: boolean
}) {
  const suit = card[0] as SuitWithSubs
  const cardSize = big ? 'w-12 h-16' : 'w-3 h-5'
  const numberSize = big ? 'text-lg' : ''
  const halfDims = 'w-1.5 h-2.5'

  return (
    <div
      className={`border-2 select-none rounded-sm ${highlight ? 'hover:border-emerald-300' : ''} border-white text-white text-xs font-black drop-shadow`}
    >
      {!multi && (
        <div
          className={`${showBack ? 'bg-sky-700' : suitToBg[suit]} ${cardSize} flex items-center justify-center`}
        />
      )}
      {multi && (
        <>
          <div className="flex">
            <div className={`${halfDims} ${suitToBg['B']}`} />
            <div className={`${halfDims} ${suitToBg['G']}`} />
          </div>
          <div className="flex">
            <div className={`${halfDims} ${suitToBg['Y']}`} />
            <div className={`${halfDims} ${suitToBg['P']}`} />
          </div>
        </>
      )}
      {showNumber && !showBack && (
        <div
          className={`absolute ${cardSize} flex items-center justify-center top-0 left-0`}
        >
          <div className={`${numberSize} drop-shadow`}>{card[1]}</div>
        </div>
      )}
      {multiplier && (
        <div
          className="absolute w-4 h-4 rounded-sm drop-shadow top-0.5 right-2.5 bg-amber-500 text-black text-center"
          style={{ fontSize: '10px' }}
        >
          {`x${multiplier}`}
        </div>
      )}
    </div>
  )
}

export function Hand({
  hand,
  big,
  showBack,
  showNumber,
  multi,
  multiplier,
  highlight,
  onClick,
  indicateUnplayableCards,
}: {
  hand: CardValue[]
  big?: boolean
  showBack?: boolean
  showNumber?: boolean
  multi?: boolean
  multiplier?: number
  highlight?: (card: CardValue) => boolean
  onClick?: (card: CardValue) => void
  indicateUnplayableCards?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {hand.map((card) => {
        const faded = indicateUnplayableCards && highlight && !highlight(card)
        return (
          <div
            key={card}
            onClick={onClick ? () => onClick(card) : undefined}
            className={faded ? 'opacity-50' : ''}
          >
            <Card
              card={card}
              big={big}
              showBack={showBack}
              showNumber={showNumber}
              multi={multi}
              multiplier={multiplier}
              highlight={highlight ? highlight(card) : false}
            />
          </div>
        )
      })}
    </div>
  )
}
