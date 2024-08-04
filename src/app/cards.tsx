import { Button } from './button'
import { CardValue, Hint, Suit, SuitWithSubs } from './types'

export function getSuit(cardValue: CardValue): SuitWithSubs {
  return cardValue[0] as Suit
}
export function getNumber(cardValue: CardValue): number {
  return parseInt(cardValue[1])
}
export function isSub(cardValue: CardValue): boolean {
  return getSuit(cardValue) === 's'
}

const suitToBg = {
  Y: 'bg-amber-300',
  P: 'bg-red-300',
  G: 'bg-green-300',
  B: 'bg-sky-300',
  s: 'bg-black',
}

const suitToImg = {
  Y: 'yellow.png',
  P: 'pink.png',
  G: 'green.png',
  B: 'blue.png',
  s: 'black.png',
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
    <div className="inline-block border-2 rounded-sm border-white text-white text-xs font-black drop-shadow mr-2 ml-1">
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
      className={`relative border-2 select-none rounded-sm ${highlight ? 'hover:border-emerald-300' : ''} border-white text-white text-xs font-black drop-shadow`}
    >
      {!multi && (
        <div
          className={`${showBack ? 'bg-sky-700' : big ? '' : suitToBg[suit]} ${cardSize} flex items-center justify-center bg-center`}
          style={{
            backgroundImage: big ? `url(/${suitToImg[suit]})` : undefined,
            backgroundSize: '72px 100px',
          }}
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
