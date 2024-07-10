export const cards = [
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "B7",
  "B8",
  "B9",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "Y1",
  "Y2",
  "Y3",
  "Y4",
  "Y5",
  "Y6",
  "Y7",
  "Y8",
  "Y9",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "s1",
  "s2",
  "s3",
  "s4", // lowercase to sort last //
] as const

export type CardValue = (typeof cards)[number]

export type Trick = [CardValue, CardValue, CardValue, CardValue]
export interface Hint {
  card: CardValue
  type: "top" | "only" | "bottom"
}

export type Suit = "B" | "P" | "Y" | "G"
export type SuitWithSubs = Suit | "s"

const suitToBg = {
  Y: "bg-amber-300",
  P: "bg-red-300",
  G: "bg-green-300",
  B: "bg-sky-300",
  s: "bg-black",
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
  showNumber,
  multi,
  showBack,
  multiplier,
}: {
  card: CardValue
  showNumber?: boolean
  multi?: boolean
  showBack?: boolean
  multiplier?: number
}) {
  const suit = card[0] as SuitWithSubs
  const halfDims = "w-1.5 h-2.5"

  return (
    <div className="border-2 rounded-sm border-white text-white text-xs font-black drop-shadow">
      {!multi && (
        <div
          className={`${showBack ? "bg-sky-700" : suitToBg[suit]} w-3 h-5 flex items-center justify-center`}
        />
      )}
      {multi && (
        <>
          <div className="flex">
            <div className={`${halfDims} ${suitToBg["B"]}`} />
            <div className={`${halfDims} ${suitToBg["G"]}`} />
          </div>
          <div className="flex">
            <div className={`${halfDims} ${suitToBg["Y"]}`} />
            <div className={`${halfDims} ${suitToBg["P"]}`} />
          </div>
        </>
      )}
      {showNumber && !showBack && (
        <div className="absolute w-3 h-5 flex items-center justify-center top-0 left-0">
          <div className="drop-shadow">{card[1]}</div>
        </div>
      )}
      {multiplier && (
        <div
          className="absolute w-4 h-4 rounded-sm drop-shadow top-0.5 right-2.5 bg-amber-500 text-black text-center"
          style={{ fontSize: "10px" }}
        >
          {`x${multiplier}`}
        </div>
      )}
    </div>
  )
}

export function Hand({
  hand,
  showBack,
  showNumber,
  multi,
  multiplier,
}: {
  hand: CardValue[]
  showBack?: boolean
  showNumber?: boolean
  multi?: boolean
  multiplier?: number
}) {
  return (
    <div className="flex gap-0.5">
      {hand.map((card) => (
        <Card
          key={card}
          card={card}
          showBack={showBack}
          showNumber={showNumber}
          multi={multi}
          multiplier={multiplier}
        />
      ))}
    </div>
  )
}
