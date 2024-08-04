'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Card, Hand, Signal, SignalButton } from './cards'
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
} from './game'
import { setLocalStorage } from './local-storage'
import { socket, send, connect, guid } from './ws'
import { Button } from './button'
import { signalType } from './hint'
import { pickSeat } from './utils'
import {
  CardValue,
  CardWithPosition,
  GameState,
  Hint,
  Player,
  ServerGameState,
} from './types'

const slotStyle = {
  height: '536px',
  width: '384px',
}

function Slot({
  highlighted,
  children,
}: {
  highlighted?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={`${highlighted ? 'border-4 border-emerald-200' : 'border-4 border-slate-50'} relative bg-slate-50 rounded-md flex items-center justify-center`}
      style={slotStyle}
    >
      {children}
    </div>
  )
}

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
  const pts = serverState.meta.target || 12
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
    <div className="flex flex-col gap-16 items-center">
      {haveJoined && !readyToPlay && <div>Waiting for more players...</div>}
      {haveJoined && readyToPlay && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              send({
                type: 'start',
              })
            }}
          >
            {`Start game (${pts} pts)`}
          </Button>
          <div className="flex gap-2 justify-center">
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

function Seat({ player }: { player: Player }) {
  const gameState = useAtomValue(gameStateAtom)
  const serverState = useAtomValue(serverStateAtom)
  const [signaling, setSignaling] = useState(false)
  const [pendingSignal, setPendingSignal] = useState<Hint | null>(null)

  const isMe = player.guid === guid
  const isActivePlayer =
    isMe &&
    gameState.whoseTurn === player.seat &&
    gameState.missions.length === 0

  if (!player.name || serverState.status !== 'started') {
    return <div style={slotStyle}></div>
  }

  const leadCard = gameState.activeTrick.cards[0]?.card || null
  let hasSuit = false
  if (leadCard) {
    hasSuit = player.hand.some((card) => card[0] === leadCard[0])
  }

  const canSignal = isMe && !player.hint && !gameState.missions.length

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
    <Slot highlighted={gameState.whoseTurn === player.seat}>
      <div className="p-3 flex flex-col gap-4" style={slotStyle}>
        <div className="flex gap-2 items-center">
          <div className="font-bold">
            {player.seat === gameState.captainSeat && '👑'} {player.name}
          </div>
          <Signal hint={player.hint || pendingSignal} />
          {canSignal && (
            <SignalButton
              pendingSignal={pendingSignal}
              signaling={signaling}
              startSignaling={() => setSignaling(true)}
              cancelSignal={() => {
                send({ type: 'move', move: 'h:cancel' })
                setSignaling(false)
                setPendingSignal(null)
              }}
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Hand
            highlight={canUseCard}
            hand={player.hand}
            big={isMe}
            showBack={!isMe}
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
          {!!gameState.missions.length && (
            <div className="h-7 text-slate-400">
              Pass ({player.passesRemaining} remaining)
            </div>
          )}
        </div>
        <div>
          {player.missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              numPlayers={gameState.numPlayers}
              showCheckbox
            />
          ))}
        </div>
        <div className="flex gap-6 flex-wrap">
          {player.tricks.map((trick, i) => (
            <Hand key={i} hand={trick.cards.map((c) => c.card)} showNumber />
          ))}
        </div>
      </div>
    </Slot>
  )
}

function MissionPicker({
  gameState,
  serverState,
}: {
  gameState: GameState
  serverState: ServerGameState
}) {
  const isActivePlayer = serverState[gameState.whoseTurn].split(':')[0] === guid
  const me = gameState.players.find((p) => p.guid === guid)
  const passesRemaining = me?.passesRemaining || 0

  return (
    <div className="w-full">
      <GameHeader />
      <div className="px-2 pt-2 justify-center">
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
      <div className="px-2 absolute bottom-2 w-full">
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
    <div className="flex absolute justify-between w-full top-2 px-2 items-center">
      <div className="px-3">Target: {serverState.meta.target}</div>
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
  const positionMap = {
    seat1: 'left-2',
    seat2: 'right-2',
    seat3: 'bottom-2 right-2',
    seat4: 'bottom-2',
    seat5: 'bottom-2 left-2',
  }

  return (
    <>
      {<GameHeader />}
      {trick.map((card) => (
        <div
          key={card.card}
          className={`absolute flex place-self-center ${positionMap[card.position]} ${faded ? 'animate-fade' : ''}`}
        >
          <Card card={card.card} big showNumber />
        </div>
      ))}
    </>
  )
}

function Table() {
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)

  if (!guid) {
    return null
  }

  if (serverState.status === 'started') {
    if (gameState.missions.length) {
      return <MissionPicker gameState={gameState} serverState={serverState} />
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

  return <Lobby />
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

function PageInner() {
  const gameState = useAtomValue(gameStateAtom)

  return (
    <div className="flex items-center justify-center w-screen py-8">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Seat player={gameState.players[0]} />
          <Slot>
            <Table />
          </Slot>
          <Seat player={gameState.players[1]} />
        </div>
        <div className="flex gap-4">
          <Seat player={gameState.players[4]} />
          <Seat player={gameState.players[3]} />
          <Seat player={gameState.players[2]} />
        </div>
      </div>
    </div>
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
