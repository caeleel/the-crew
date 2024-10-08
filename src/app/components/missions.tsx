import { Card, CardNumber, Hand } from './cards'
import { CardValue, Mission } from '../types'

export const missions: Mission[] = [
  { id: '93', points: [1, 1, 1], willWin: ['G6'] },
  { id: '92', points: [1, 1, 1], willWin: ['P3'] },
  { id: '91', points: [1, 1, 1], willWin: ['Y1'] },
  { id: '90', points: [1, 1, 1], willWin: ['B4'] },
  { id: '89', points: [3, 4, 5], willWin: ['B3', 'P3', 'G3', 'Y3'] },
  { id: '88', points: [3, 4, 5], willWin: ['B9', 'P9', 'G9', 'Y9'] },
  { id: '87', points: [2, 2, 2], willWin: ['P1', 'G7'] },
  { id: '86', points: [2, 3, 3], willWin: ['Y9', 'B7'] },
  { id: '85', points: [2, 2, 3], willWin: ['P8', 'B5'] },
  { id: '84', points: [2, 2, 3], willWin: ['G5', 'B8'] },
  { id: '83', points: [2, 2, 3], willWin: ['B6', 'Y7'] },
  { id: '82', points: [2, 2, 3], willWin: ['P5', 'Y6'] },
  { id: '81', points: [2, 3, 3], willWin: ['P9', 'Y8'] },
  {
    id: '80',
    points: [3, 3, 3],
    willWin: ['s1'],
    wontWinCards: ['s2', 's3', 's4'],
  },
  {
    id: '79',
    points: [3, 3, 3],
    willWin: ['s2'],
    wontWinCards: ['s1', 's3', 's4'],
  },
  { id: '78', points: [1, 1, 1], willWin: ['s3'] },
  { id: '77', points: [3, 4, 4], willWin: ['G3', 'Y4', 'Y5'] },
  { id: '76', points: [2, 3, 3], willWin: ['B1', 'B2', 'B3'] },
  { id: '75', points: [1, 1, 1], wontWinColors: ['s'] },
  { id: '74', points: [3, 3, 3], wontWinColors: ['Y', 'G'] },
  { id: '73', points: [3, 3, 3], wontWinColors: ['P', 'B'] },
  { id: '72', points: [2, 2, 2], wontWinColors: ['P'] },
  { id: '71', points: [2, 2, 2], wontWinColors: ['Y'] },
  { id: '95', points: [2, 2, 2], wontWinColors: ['G'] },
  { id: '70', points: [1, 1, 1], wontWinNumbers: [9] },
  { id: '69', points: [1, 2, 2], wontWinNumbers: [5] },
  { id: '68', points: [2, 2, 2], wontWinNumbers: [1] },
  { id: '67', points: [3, 3, 3], wontWinNumbers: [1, 2, 3] },
  { id: '66', points: [3, 3, 2], wontWinNumbers: [8, 9] },
  { id: '65', points: [3, 3, 3], willWinWithSub: 'G9' },
  { id: '64', points: [3, 3, 3], willWinWithSub: 'P7' },
  { id: '63', points: [3, 4, 5], willWinWith: { with: 3 } },
  { id: '62', points: [2, 3, 3], willWinWith: { with: 6 } },
  { id: '61', points: [2, 3, 4], willWinWith: { with: 5 } },
  { id: '60', points: [3, 4, 5], willWinWith: { with: 2 } },
  { id: '59', points: [2, 3, 4], willWinWith: { with: 6, capturing: 6 } },
  { id: '58', points: [1, 2, 2], willWinWith: { with: 7, capturing: 5 } },
  { id: '57', points: [3, 4, 5], willWinWith: { with: 4, capturing: 8 } },
  {
    id: '56',
    points: [3, 3, 4],
    totalLessThan: [24, 24, 24],
    totalGreaterThan: [21, 21, 21],
  },
  { id: '55', points: [3, 3, 4], totalLessThan: [8, 12, 16] },
  { id: '54', points: [3, 3, 4], totalGreaterThan: [23, 28, 31] },
  {
    id: '53',
    points: [2, 3, 3],
    allCardsGreaterOrLessThan: { lessOrGreater: '<', value: 7 },
  },
  {
    id: '52',
    points: [2, 3, 4],
    allCardsGreaterOrLessThan: { lessOrGreater: '>', value: 5 },
  },
  { id: '51', points: [2, 2, 3], relativeToCaptain: 'more' },
  { id: '50', points: [2, 2, 2], relativeToCaptain: 'fewer' },
  { id: '49', points: [4, 3, 3], relativeToCaptain: 'as many' },
  { id: '48', points: [2, 5, 6], oddOrEven: 'even' },
  { id: '47', points: [2, 4, 5], oddOrEven: 'odd' },
  { id: '46', points: [2, 3, 3], relativeToOthers: 'more' },
  { id: '45', points: [2, 2, 3], relativeToOthers: 'fewer' },
  { id: '44', points: [3, 4, 5], relativeToOthers: 'moreCombined' },
  { id: '43', points: [3, 4, 5], finalTrickCapture: 'G2' },
  {
    id: '42',
    points: [3, 4, 5],
    winNumber: { target: 9, count: 3, exact: false },
  },
  {
    id: '41',
    points: [3, 4, 5],
    winNumber: { target: 5, count: 3, exact: false },
  },
  {
    id: '40',
    points: [3, 4, 4],
    winNumber: { target: 6, count: 3, exact: true },
  },
  {
    id: '39',
    points: [3, 4, 4],
    winSuit: [{ suit: 'G', count: 2, exact: true }],
  },
  {
    id: '38',
    points: [2, 2, 2],
    winNumber: { target: 7, count: 2, exact: false },
  },
  {
    id: '37',
    points: [2, 3, 3],
    winNumber: { target: 9, count: 2, exact: true },
  },
  {
    id: '36',
    points: [3, 4, 4],
    winSuit: [{ suit: 's', count: 3, exact: true }],
  },
  {
    id: '35',
    points: [3, 3, 4],
    winSuit: [{ suit: 's', count: 2, exact: true }],
  },
  {
    id: '34',
    points: [3, 3, 3],
    winSuit: [{ suit: 's', count: 1, exact: true }],
  },
  {
    id: '33',
    points: [3, 3, 4],
    winSuit: [{ suit: 'P', count: 1, exact: true }],
  },
  {
    id: '32',
    points: [3, 4, 4],
    winSuit: [{ suit: 'B', count: 2, exact: true }],
  },
  {
    id: '94',
    points: [4, 4, 4],
    winSuit: [
      { suit: 'P', count: 1, exact: true },
      { suit: 'G', count: 1, exact: true },
    ],
  },
  {
    id: '31',
    points: [2, 3, 3],
    winSuit: [{ suit: 'P', count: 5, exact: false }],
  },
  {
    id: '30',
    points: [3, 3, 3],
    winSuit: [{ suit: 'Y', count: 7, exact: false }],
  },
  { id: '29', points: [3, 4, 5], special: 'allInOne' },
  { id: '28', points: [2, 3, 4], special: 'oneInAll' },
  { id: '27', points: [2, 3, 3], equalInTrick: ['P', 'B'] },
  { id: '26', points: [2, 3, 3], equalInTrick: ['G', 'Y'] },
  { id: '25', points: [4, 3, 3], notOpenWith: ['P', 'Y', 'B'] },
  { id: '24', points: [2, 1, 1], notOpenWith: ['P', 'G'] },
  {
    id: '23',
    points: [4, 4, 4],
    comparison: { suits: ['P', 'Y'], comparator: '=' },
  },
  {
    id: '22',
    points: [1, 1, 1],
    comparison: { suits: ['Y', 'B'], comparator: '>' },
  },
  {
    id: '21',
    points: [1, 1, 1],
    comparison: { suits: ['P', 'G'], comparator: '>' },
  },
  { id: '20', points: [1, 1, 1], firstNTricks: 1 },
  { id: '19', points: [1, 1, 2], firstNTricks: 2 },
  { id: '18', points: [2, 3, 4], firstNTricks: 3 },
  { id: '17', points: [2, 3, 3], lastNTricks: 1 },
  { id: '16', points: [4, 4, 4], numTricks: 1, lastNTricks: 1 },
  { id: '15', points: [3, 4, 4], firstNTricks: 1, lastNTricks: 1 },
  { id: '14', points: [4, 3, 3], numTricks: 1, firstNTricks: 1 },
  { id: '13', points: [4, 3, 3], numTricks: 0 },
  { id: '12', points: [3, 2, 2], numTricks: 1 },
  { id: '11', points: [2, 2, 2], numTricks: 2 },
  { id: '10', points: [2, 3, 5], numTricks: 4 },
  { id: '9', points: [4, 3, 3], xIsPublic: false },
  { id: '8', points: [3, 2, 2], xIsPublic: true },
  { id: '7', points: [1, 2, 2], noneOfTheFirst: 3 },
  { id: '6', points: [1, 2, 3], noneOfTheFirst: 4 },
  { id: '5', points: [2, 3, 3], noneOfTheFirst: 5 },
  { id: '4', points: [1, 1, 1], nInARow: 2 },
  { id: '3', points: [2, 3, 4], nInARow: 3 },
  { id: '2', points: [3, 2, 2], notNInARow: 2 },
  { id: '0', points: [3, 3, 3], numTricks: 2, nInARow: 2 },
  { id: '1', points: [3, 3, 4], numTricks: 3, nInARow: 3 },
] as const

function MissionMessage({ text }: { text: string }) {
  return <span>{text}</span>
}

function MissionInner({
  mission,
  numPlayers,
}: {
  mission: Mission
  numPlayers: number
}) {
  if (mission.willWin) {
    return (
      <>
        <MissionMessage text="I will win" />
        <Hand hand={mission.willWin} showNumber />
        {mission.wontWinCards && (
          <>
            <MissionMessage text="and not" />
            <Hand hand={mission.wontWinCards} showNumber />
          </>
        )}
      </>
    )
  }
  if (mission.wontWinNumbers) {
    return (
      <>
        <MissionMessage text="I will win no" />
        <Hand
          hand={mission.wontWinNumbers.map((n) => `B${n}` as CardValue)}
          multi
          showNumber
        />
      </>
    )
  }
  if (mission.wontWinColors) {
    return (
      <>
        <MissionMessage text={'I will win no'} />
        <Hand hand={mission.wontWinColors.map((c) => `${c}1` as CardValue)} />
      </>
    )
  }
  if (mission.willWinWith) {
    if (mission.willWinWith.capturing) {
      return (
        <>
          <MissionMessage key="t1" text={'I will win a'} />
          <Card
            key="c1"
            card={`B${mission.willWinWith.capturing}` as CardValue}
            showNumber
            multi
          />
          <MissionMessage key="t2" text={'with a'} />
          <Card
            key="c2"
            card={`B${mission.willWinWith.with}` as CardValue}
            showNumber
            multi
          />
        </>
      )
    } else {
      return (
        <>
          <MissionMessage text={'I will win a trick using a'} />
          <Card
            card={`B${mission.willWinWith.with}` as CardValue}
            showNumber
            multi
          />
        </>
      )
    }
  }
  if (mission.willWinWithSub) {
    return (
      <>
        <MissionMessage text={'I will win'} />
        <Card card={mission.willWinWithSub} showNumber />
        <MissionMessage text={'with a'} />
        <Card card={'s1'} />
      </>
    )
  }
  if (mission.winNumber) {
    return (
      <>
        <MissionMessage
          text={`I will win ${mission.winNumber.exact ? 'exactly' : 'at least'}`}
        />
        <div className="px-2">
          <Card
            card={`B${mission.winNumber.target}` as CardValue}
            showNumber
            multi
            multiplier={mission.winNumber.count}
          />
        </div>
      </>
    )
  }
  if (mission.winSuit) {
    return (
      <>
        <MissionMessage
          text={`I will win ${mission.winSuit[0].exact ? 'exactly' : 'at least'}`}
        />
        <div className="flex gap-4 px-2">
          {mission.winSuit.map((win) => (
            <Card
              key={win.suit}
              card={`${win.suit}1` as CardValue}
              multiplier={win.count}
            />
          ))}
        </div>
      </>
    )
  }
  if (mission.numTricks !== undefined) {
    let text = `I will win exactly ${mission.numTricks} trick${mission.numTricks !== 1 ? 's' : ''}`
    if (mission.firstNTricks) {
      if (mission.firstNTricks === 1) {
        text = 'I will win only the first trick'
      } else {
        text = `I will win only the first ${mission.firstNTricks} tricks`
      }
    } else if (mission.lastNTricks) {
      if (mission.lastNTricks === 1) {
        text = 'I will win only the last trick'
      } else {
        text = `I will win only the last ${mission.lastNTricks} tricks`
      }
    } else if (mission.nInARow) {
      text += ' and they will be in a row'
    }
    return <MissionMessage text={text} />
  }
  if (mission.firstNTricks) {
    if (mission.firstNTricks === 1 && mission.lastNTricks === 1) {
      return <MissionMessage text={'I will win the first and the last trick'} />
    }
    if (mission.firstNTricks === 1) {
      return <MissionMessage text={'I will win the first trick'} />
    }
    return (
      <MissionMessage
        text={`I will win the first ${mission.firstNTricks} tricks`}
      />
    )
  }
  if (mission.noneOfTheFirst) {
    return (
      <MissionMessage
        text={`I will win none of the first ${mission.noneOfTheFirst} tricks`}
      />
    )
  }
  if (mission.nInARow) {
    return (
      <MissionMessage text={`I will win ${mission.nInARow} tricks in a row`} />
    )
  }
  if (mission.notNInARow) {
    return (
      <MissionMessage
        text={`I will never win ${mission.notNInARow} tricks in a row`}
      />
    )
  }
  if (mission.notOpenWith) {
    return (
      <>
        <MissionMessage text={'I will not open a trick with'} />
        <Hand
          hand={mission.notOpenWith.map((color) => `${color}1` as CardValue)}
        />
      </>
    )
  }
  if (mission.special === 'allInOne') {
    return (
      <MissionMessage
        text={'I will win all the cards in at least one of the 4 colors'}
      />
    )
  }
  if (mission.special === 'oneInAll') {
    return (
      <>
        <MissionMessage text={'I will win at least 1 card of each color'} />
        <div className="w-14">
          <Hand hand={['B1', 'G1', 'Y1', 'P1']} />
        </div>
      </>
    )
  }
  if (mission.oddOrEven === 'odd') {
    return (
      <>
        <MissionMessage
          text={'I will win a trick that has only odd-numbered cards'}
        />
        <div className="w-28">
          <Hand hand={['B1', 'B3', 'B5', 'B7', 'B9']} showNumber multi />
        </div>
      </>
    )
  }
  if (mission.oddOrEven === 'even') {
    return (
      <>
        <MissionMessage
          text={'I will win a trick that has only even-numbered cards'}
        />
        <Hand hand={['B2', 'B4', 'B6', 'B8']} showNumber multi />
      </>
    )
  }
  if (mission.finalTrickCapture) {
    return (
      <>
        <MissionMessage text="In the final trick, I will win" />
        <Card card={mission.finalTrickCapture} showNumber />
      </>
    )
  }
  if (mission.relativeToCaptain) {
    return (
      <MissionMessage
        text={`I will win ${mission.relativeToCaptain} tricks ${mission.relativeToCaptain === 'as many' ? 'as' : 'than'} 👑`}
      />
    )
  }
  if (mission.relativeToOthers === 'moreCombined') {
    return (
      <MissionMessage text="I will win more tricks than everyone else combined" />
    )
  }
  if (mission.relativeToOthers) {
    return (
      <MissionMessage
        text={`I will win ${mission.relativeToOthers} tricks than anyone else`}
      />
    )
  }
  if (mission.allCardsGreaterOrLessThan) {
    return (
      <div className="inline-block">
        <MissionMessage
          text={`I will win a trick where all cards are ${mission.allCardsGreaterOrLessThan.lessOrGreater} `}
        />
        <CardNumber n={mission.allCardsGreaterOrLessThan.value} />
        <MissionMessage text="(no subs)" />
      </div>
    )
  }
  if (mission.totalLessThan) {
    if (mission.totalGreaterThan) {
      return (
        <MissionMessage
          text={`I will win a trick where ${mission.totalGreaterThan[numPlayers - 3]} < total value < ${mission.totalLessThan[numPlayers - 3]}`}
        />
      )
    }
    return (
      <div className="inline-block">
        <MissionMessage text="I will win a trick totalling less than" />
        <CardNumber n={mission.totalLessThan[numPlayers - 3]} />
        <MissionMessage text="(no subs)" />
      </div>
    )
  }
  if (mission.totalGreaterThan) {
    return (
      <div className="inline-block">
        <MissionMessage text="I will win a trick with total value greater than" />
        <CardNumber n={mission.totalGreaterThan[numPlayers - 3]} />
      </div>
    )
  }
  if (mission.equalInTrick) {
    return (
      <>
        <MissionMessage text="In 1 trick, I will win = amounts of " />
        <Hand hand={mission.equalInTrick.map((c) => `${c}1` as CardValue)} />
      </>
    )
  }
  if (mission.comparison) {
    return (
      <>
        <MissionMessage text="In total, I will win" />
        <div className="flex gap-0.5">
          <Card card={`${mission.comparison.suits[0]}1`} />
          <div className="text-sm">{mission.comparison.comparator}</div>
          <Card card={`${mission.comparison.suits[1]}1`} />
        </div>
      </>
    )
  }
  if (mission.lastNTricks) {
    if (mission.lastNTricks === 1) {
      return <MissionMessage text={'I will win the last trick'} />
    }
    return (
      <MissionMessage
        text={`I will win the last ${mission.lastNTricks} tricks`}
      />
    )
  }
  if (mission.xIsPublic !== undefined) {
    return (
      <MissionMessage
        text={`I will win exactly ${mission.x === undefined ? 'X' : mission.x} tricks (${mission.xIsPublic ? 'public' : 'secret'})`}
      />
    )
  }

  return null
}

export function MissionCard({
  mission,
  numPlayers,
  isActivePlayer,
  showCheckbox,
}: {
  mission: Mission
  numPlayers: number
  isActivePlayer?: boolean
  showCheckbox?: boolean
}) {
  const status =
    mission.status === 'pass' ? '✅' : mission.status === 'fail' ? '😢' : '⬜'

  return (
    <div
      className={`${isActivePlayer ? 'hover:bg-slate-200' : ''} py-2 ${showCheckbox ? 'pr-4' : 'px-4'} flex rounded-md`}
    >
      <div className="flex items-center gap-2 select-none text-sm">
        {showCheckbox && <div>{status}</div>}
        <MissionInner mission={mission} numPlayers={numPlayers} />
      </div>
    </div>
  )
}

export function MissionDebugger() {
  return (
    <div className="flex w-screen h-screen gap-4 flex-wrap">
      {missions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} numPlayers={3} />
      ))}
    </div>
  )
}
