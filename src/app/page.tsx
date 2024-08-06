'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Card, Hand, Signal } from './cards'
import { MissionCard } from './missions'
import { Provider, useAtom, useAtomValue } from 'jotai'
import {
  joined,
  numJoined,
  handleMsg,
  serverStateAtom,
  gameStateAtom,
  nameAtom,
  atomStore,
  targetPts,
} from './game'
import { setLocalStorage } from './local-storage'
import { socket, send, connect, guid } from './ws'
import { Button, EmoteButton, emotes, SignalButton } from './button'
import { signalType } from './hint'
import { pickSeat } from './utils'
import {
  CardValue,
  CardWithPosition,
  Hint,
  Player,
  SeatKey,
  ServerGameState,
} from './types'

function Lobby() {
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)
  const [name, setName] = useAtom(nameAtom)

  if (!guid || !socket) {
    return null
  }

  const haveJoined = joined(guid, serverState)
  const seatToJoin = pickSeat(serverState)
  const readyToPlay = numJoined(serverState) >= 3
  const pts = targetPts(serverState)
  const setPts = (pts: number) => {
    send({
      type: 'meta',
      meta: { target: pts },
    })
  }

  const join = () => {
    send({
      type: 'join',
      seat: seatToJoin,
      name,
    })
  }

  return (
    <div className="flex flex-col gap-12 items-center w-80">
      {haveJoined && !readyToPlay && <div>Waiting for more players...</div>}
      {haveJoined && readyToPlay && (
        <div className="flex gap-2 w-full justify-between">
          <Button
            full
            onClick={() => {
              send({
                type: 'start',
              })
            }}
          >
            {`Start game (${pts} pts)`}
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => setPts(pts + 1)}>⬆️</Button>
            <Button disabled={pts < 11} onClick={() => setPts(pts - 1)}>
              ⬇️
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 items-center">
        <div>Players:</div>
        <div className="flex flex-col items-center">
          {gameState.players.map((p) =>
            p.guid ? (
              <div
                className={guid === p.guid ? 'font-bold' : undefined}
                key={p.guid}
              >
                {p.name}
              </div>
            ) : undefined,
          )}
        </div>
      </div>
      {!haveJoined && seatToJoin ? (
        <div className="flex flex-col gap-3">
          <input
            className="text-center h-10"
            placeholder="Enter your name"
            value={name}
            onKeyDown={(e) => {
              console.log(e.key)
              if (e.key === 'Enter') {
                join()
              }
            }}
            onChange={(e) => {
              const newName = e.target.value
              setName(newName)
              setLocalStorage('name', newName)
            }}
          />
          <Button onClick={join}>Join</Button>
        </div>
      ) : (
        <Button
          full
          onClick={() => {
            send({
              type: 'leave',
              guid,
            })
          }}
        >
          Leave
        </Button>
      )}
    </div>
  )
}

const seatColor = {
  seat1: 'sky',
  seat2: 'emerald',
  seat3: 'orange',
  seat4: 'violet',
  seat5: 'pink',
}

const seatAvatar = {
  seat1: 'bunny',
  seat2: 'snek',
  seat3: 'cow',
  seat4: 'frog',
  seat5: 'cat',
}

function PlayerCard({
  player,
  pendingSignal,
}: {
  player: Player
  pendingSignal?: Hint | null
}) {
  const gameState = useAtomValue(gameStateAtom)

  if (!player) {
    return null
  }

  const { seat, missions, tricks, name, passesRemaining, hint, emote } = player
  const bgColor = `bg-${seatColor[seat]}-50`
  const borderColor = `border-${seatColor[seat]}-300`
  const isMyTurn = gameState.whoseTurn === seat
  const isMe = player.guid === guid

  return (
    <div
      className={`p-4 flex flex-col gap-2 ${bgColor} ${borderColor} rounded-lg ${isMyTurn ? 'border-2' : ''} h-fit shrink-0`}
      style={{ width: '336px' }}
    >
      <div className="flex gap-2 items-center">
        <div className="relative">
          {emote === 'distress' ? (
            <img src={`/${seatAvatar[seat]}-distressed.svg`} />
          ) : (
            <img src={`/${seatAvatar[seat]}.svg`} />
          )}
          {seat === gameState.captainSeat && (
            <div
              className="absolute w-8 h-8"
              style={{ bottom: '52px', right: '32px' }}
            >
              <img src={'/crown.png'} className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex items-center">
          <div>
            <img src="/triangle.svg" />
          </div>
          <div className="bg-white py-2 px-4 rounded-md">
            <div className="flex gap-2 items-center">
              <div className="font-bold">{name}</div>
              {!gameState.missions.length && (
                <Signal hint={hint || pendingSignal || null} />
              )}
            </div>
            {!!gameState.missions.length && (
              <div className="text-slate-400">
                {passesRemaining} pass
                {passesRemaining !== 1 ? 'es' : ''} left
              </div>
            )}
            {emote && emote !== 'none' && (
              <div className="italic text-slate-400">{emotes[emote]}</div>
            )}
          </div>
        </div>
      </div>
      {isMe && (
        <div className="flex gap-2 items-center">
          <EmoteButton emote="distress" current={emote} />
          <EmoteButton emote="winnable" current={emote} />
          <EmoteButton emote="trust" current={emote} />
        </div>
      )}
      {!!missions.length && (
        <div>
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              numPlayers={gameState.numPlayers}
              showCheckbox
            />
          ))}
        </div>
      )}
      {!!tricks.length && (
        <div className="flex gap-6 flex-wrap">
          {tricks.map((trick, i) => (
            <Hand key={i} hand={trick.cards.map((c) => c.card)} showNumber />
          ))}
        </div>
      )}
    </div>
  )
}

function Seat({ player }: { player: Player }) {
  const gameState = useAtomValue(gameStateAtom)
  const serverState = useAtomValue(serverStateAtom)
  const [signaling, setSignaling] = useState(false)
  const [pendingSignal, setPendingSignal] = useState<Hint | null>(null)

  const isMyTurn = gameState.whoseTurn === player.seat
  const isActivePlayer = isMyTurn && gameState.missions.length === 0
  const canSignal =
    !player.hint && !gameState.missions.length && player.guid === guid

  if (!player.name || serverState.status !== 'started') {
    return null
  }

  const leadCard = gameState.activeTrick.cards[0]?.card || null
  let hasSuit = false
  if (leadCard) {
    hasSuit = player.hand.some((card) => card[0] === leadCard[0])
  }

  const canUseCard = (card: CardValue) => {
    if (signaling) {
      if (card[0] === 's') return false

      return !!signalType(card, player.hand)
    }

    if (!isActivePlayer) {
      return false
    }

    if (hasSuit) {
      return card[0] === leadCard[0]
    }

    return true
  }

  return (
    <div className={`flex gap-8 items-center mx-8`}>
      <PlayerCard player={player} pendingSignal={pendingSignal} />
      <div className="flex flex-col gap-3 shrink">
        <div className="flex gap-3 items-center">
          <SignalButton
            pendingSignal={pendingSignal || null}
            canSignal={canSignal}
            signaling={!!signaling}
            startSignaling={() => setSignaling!(true)}
            cancelSignal={() => {
              send({ type: 'move', move: 'h:cancel' })
              setSignaling!(false)
              setPendingSignal!(null)
            }}
          />
        </div>
        <Hand
          highlight={canUseCard}
          hand={player.hand}
          big
          showNumber
          onClick={(card) => {
            if (canUseCard(card)) {
              if (signaling) {
                const type = signalType(card, player.hand)!
                send({
                  type: 'move',
                  move: `h:${card}:${type}`,
                })
                setPendingSignal({ card, type, played: false })
                setSignaling(false)
              } else {
                send({
                  type: 'move',
                  move: `p:${card}`,
                })
              }
            }
          }}
          indicateUnplayableCards={signaling}
        />
      </div>
    </div>
  )
}

function MissionPicker() {
  const gameState = useAtomValue(gameStateAtom)
  const serverState = useAtomValue(serverStateAtom)
  const isActivePlayer = serverState[gameState.whoseTurn].split(':')[0] === guid
  const me = gameState.players.find((p) => p.guid === guid)
  const passesRemaining = me?.passesRemaining || 0

  return (
    <div className="p-4 flex flex-col gap-4 rounded-lg bg-slate-50 w-80">
      <div className="justify-center">
        {gameState.missions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => {
              if (isActivePlayer) {
                if (mission.xIsPublic !== undefined) {
                  let val: number | null = null
                  const valStr = prompt('Choose an X')
                  if (valStr) {
                    if (
                      !isNaN(Number(valStr)) &&
                      !valStr.includes('-') &&
                      !valStr.includes('.')
                    ) {
                      val = Number(valStr)
                    }
                  }
                  if (val === null) {
                    if (valStr !== null) {
                      alert(
                        `Invalid X: ${valStr}, re-select mission to try again`,
                      )
                    }
                    return
                  }
                  send({
                    type: 'move',
                    move: `d:${mission.id}:${val}`,
                  })
                } else {
                  send({
                    type: 'move',
                    move: `d:${mission.id}`,
                  })
                }
              }
            }}
          >
            <MissionCard
              mission={mission}
              isActivePlayer={isActivePlayer}
              numPlayers={gameState.numPlayers}
            />
          </div>
        ))}
      </div>
      <div className="w-full">
        <Button
          full
          disabled={passesRemaining === 0 || !isActivePlayer}
          onClick={() => {
            send({
              type: 'move',
              move: 'd:pass',
            })
          }}
        >
          Pass ({passesRemaining} remaining)
        </Button>
      </div>
    </div>
  )
}

function GameHeader() {
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)

  return (
    <div className="flex justify-between rounded-sm p-4 items-center w-full">
      <div className="px-3">Target: {targetPts(serverState)}</div>
      <div className="flex gap-2">
        {serverState.status === 'started' && (
          <Button
            onClick={() => {
              const ok = confirm(
                'Are you sure you want to undo the trick? This can only be used once per game',
              )
              if (ok) {
                send({
                  type: 'move',
                  move: 'u',
                })
              }
            }}
            disabled={
              gameState.undoUsed ||
              (gameState.previousTrick.index < 0 &&
                gameState.activeTrick.cards.length === 0)
            }
          >
            {gameState.undoUsed ? 'Undo used' : 'Undo trick'}
          </Button>
        )}
        <Button
          onClick={() => {
            if (confirm('Are you sure you want to end the game?')) {
              send({
                type: 'reset',
              })
            }
          }}
        >
          Next game
        </Button>
      </div>
    </div>
  )
}

function ActiveTrick({
  trick,
  faded,
}: {
  trick: CardWithPosition[]
  faded?: boolean
}) {
  const seating = seatingChart(useAtomValue(serverStateAtom))
  const cardArray: (CardValue | null)[] = [null, null, null, null, null]
  for (const card of trick) {
    const idx = Number(card.position[4]) - 1
    cardArray[idx] = card.card
  }
  const cardMap = seating.map((row) => row.map((i) => cardArray[i]))

  return (
    <div
      className={`p-4 flex flex-col justify-between items-center bg-slate-100 rounded-lg ${faded ? 'animate-fade' : ''}`}
      style={{ height: '320px', width: '540px' }}
    >
      <div className="flex justify-around w-full">
        {cardMap[1].map((card, i) =>
          card ? (
            <Card key={i} card={card} big showNumber />
          ) : (
            <div key={i} className="w-12 h-16 m-0.5" />
          ),
        )}
      </div>
      {cardMap.length === 3 && (
        <div className="flex justify-between w-full">
          {cardMap[2].map((card, i) =>
            card ? (
              <Card key={i} card={card} big showNumber />
            ) : (
              <div key={i} className="w-12 h-16 m-0.5" />
            ),
          )}
        </div>
      )}
      {cardMap[0][0] ? (
        <Card card={cardMap[0][0]} showNumber big />
      ) : (
        <div className="w-12 h-16 m-0.5" />
      )}
    </div>
  )
}

function Table() {
  const gameState = useAtomValue(gameStateAtom)

  if (!guid) {
    return null
  }

  if (gameState.missions.length) {
    return <MissionPicker />
  }

  const trick = gameState.activeTrick.cards.length
    ? gameState.activeTrick
    : gameState.previousTrick
  return (
    <ActiveTrick
      trick={trick.cards}
      faded={gameState.activeTrick.cards.length === 0}
    />
  )
}

if (typeof window !== 'undefined') {
  let channel = document.location.href.split('#', 2)[1]
  if (!channel) {
    channel = crypto.randomUUID()
    document.location.href += '#' + channel
  }
  console.log('connecting...')
  connect((msg) => {
    handleMsg(msg)
  }, channel)
}

function seatingChart(serverState: ServerGameState) {
  const filled: string[] = []
  const seatMap: { [guid: string]: number } = {}

  for (let i = 0; i < 5; i++) {
    const seat = `seat${i + 1}` as SeatKey
    const p = serverState[seat].split(':')[0]
    if (p) {
      filled.push(p)
      seatMap[p] = i
    }
  }

  let iter = filled.indexOf(guid!)
  if (iter < 0) iter = 0

  const order: number[] = []
  for (let i = 0; i < filled.length; i++) {
    order.push(seatMap[filled[iter]])
    iter = (iter + 1) % filled.length
  }

  if (order.length === 3) {
    return [[order[0]], [order[1], order[2]]]
  }

  if (order.length === 4) {
    return [[order[0]], [order[2]], [order[1], order[3]]]
  }

  return [[order[0]], [order[2], order[3]], [order[1], order[4]]]
}

function CenterSlot({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-screen h-screen items-center justify-center">
      <div className="p-8 rounded-lg border-2 border-sky-300 bg-sky-50">
        {children}
      </div>
    </div>
  )
}

function PageInner() {
  const players = useAtomValue(gameStateAtom).players
  const serverState = useAtomValue(serverStateAtom)

  if (serverState.status !== 'started') {
    return (
      <CenterSlot>
        <Lobby />
      </CenterSlot>
    )
  }

  const seating = seatingChart(serverState)

  return (
    <>
      <GameHeader />
      <div className="flex flex-col gap-8 items-center justify-center w-screen py-8">
        <div className="flex gap-8 min-h-32">
          {seating[1].map((n) => (
            <PlayerCard key={n} player={players[n]} />
          ))}
        </div>
        <div className="flex gap-8 items-center min-h-32">
          {seating.length === 3 && (
            <PlayerCard player={players[seating[2][0]]} />
          )}
          <Table />
          {seating.length === 3 && (
            <PlayerCard player={players[seating[2][1]]} />
          )}
        </div>
        <div className="min-h-32 flex items-end">
          <Seat player={players[seating[0][0]]} />
        </div>
        <div className="bg-emerald-50 border-emerald-300 bg-sky-50 border-sky-300 bg-orange-50 border-orange-300 bg-pink-50 border-pink-300 bg-violet-50 border-violet-300" />
      </div>
    </>
  )
}

export default function Page() {
  const [isServer, setServer] = useState(true)
  useEffect(() => setServer(false), [])

  if (isServer) {
    return null
  }

  return (
    <Provider store={atomStore}>
      <PageInner />
    </Provider>
  )
}
