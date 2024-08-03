'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  Card,
  cards,
  CardValue,
  Hand,
  Hint,
  Signal,
  SignalButton,
} from './cards'
import { missions, Mission, MissionCard } from './missions'
import { HintMove, Move, parseMove } from './move'
import { shuffle, setSeeds } from './rand'
import { Provider, useAtom, useAtomValue } from 'jotai'
import {
  joined,
  SeatKey,
  Player,
  numJoined,
  ServerGameState,
  GameState,
  CardWithPosition,
} from './game'
import { setLocalStorage } from './local-storage'
import { socket, send, connect, guid } from './ws'
import {
  serverStateAtom,
  gameStateAtom,
  nameAtom,
  atomStore,
  cloneEmptyPlayer,
} from './atoms'
import { Button } from './button'
import { findWinner } from './utils'
import { updateMissionStatuses } from './validate'

let moves: Move[] = []
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

function PreGameSeat({ player }: { player: Player }) {
  const serverState = useAtomValue(serverStateAtom)
  const name = useAtomValue(nameAtom)

  if (player.name) {
    return (
      <div className="flex flex-col gap-2 items-center">
        <div className="font-medium">{player.name}</div>
        {player.guid === guid && (
          <div>
            <Button
              onClick={() => {
                send({
                  type: 'leave',
                  guid,
                })
              }}
            >
              Leave seat
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!socket || !guid) {
    return null
  }

  if (joined(guid, serverState)) {
    return <div>Empty seat</div>
  }

  return (
    <Button
      onClick={() => {
        send({
          type: 'join',
          seat: player.seat,
          name,
        })
      }}
    >
      Sit here
    </Button>
  )
}

function PlayingSeat({ player }: { player: Player }) {
  const gameState = useAtomValue(gameStateAtom)
  const [signaling, setSignaling] = useState(false)
  const [pendingSignal, setPendingSignal] = useState<Hint | null>(null)

  const isMe = player.guid === guid
  const isActivePlayer =
    isMe &&
    gameState.whoseTurn === player.seat &&
    gameState.missions.length === 0

  if (!player.name) {
    return null
  }

  const leadCard = gameState.activeTrick.cards[0]?.card || null
  let hasSuit = false
  if (leadCard) {
    hasSuit = player.hand.some((card) => card[0] === leadCard[0])
  }

  const canSignal = isMe && !player.hint && !gameState.missions.length

  const signalType = (card: CardValue) => {
    const suit = card[0]

    let isSmallest = true
    let isBiggest = true
    let isOnly = true

    for (const c of player.hand) {
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

  const canUseCard = (card: CardValue) => {
    if (signaling) {
      if (card[0] === 's') return false

      return !!signalType(card)
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
                const type = signalType(card)!
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
  )
}

function Seat({ player }: { player: Player }) {
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)

  const started = serverState.status === 'started'

  return (
    <Slot highlighted={started && gameState.whoseTurn === player.seat}>
      {!started && <PreGameSeat player={player} />}
      {started && <PlayingSeat player={player} />}
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
                'Are you sure you want to undo the hand? This can only be used once per game',
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
            Undo hand
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
  const [name, setName] = useAtom(nameAtom)
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)
  const pts = serverState.meta.target || 12
  const setPts = (pts: number) => {
    send({
      type: 'meta',
      meta: { target: pts },
    })
  }

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

  if (joined(guid, serverState)) {
    if (numJoined(serverState) >= 3) {
      return (
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
      )
    }

    return <div>Waiting for more players...</div>
  }

  return (
    <input
      className="text-center border"
      placeholder="Enter your name"
      value={name}
      onChange={(e) => {
        const newName = e.target.value
        setName(newName)
        setLocalStorage('name', newName)
      }}
    />
  )
}

function seatToIdx(seat: SeatKey): number {
  return Number(seat[4]) - 1
}

function allocateMissions(missions: Mission[], players: number) {
  const { target } = atomStore.get(serverStateAtom).meta

  let current = 0
  const chosen: Mission[] = []
  let idx = 0
  while (current < target) {
    const points = missions[idx].points[players - 3]
    if (current + points <= target) {
      chosen.push(missions[idx])
      current += points
    }
    idx++
  }

  return chosen
}

let pendingHints: {
  [guid: string]: Hint | null
} = {}

function flushMoveQueue(gameState: GameState, serverState: ServerGameState) {
  for (const guid of Object.keys(pendingHints)) {
    const hint = pendingHints[guid]
    applyMove({ type: 'hint', guid, hint }, gameState, serverState)
    console.log('resulting game state', { gameState, serverState })
  }
  pendingHints = {}
}

function applyMove(
  move: Move,
  gameState: GameState,
  serverState: ServerGameState,
  playsUntilUndo?: number,
) {
  if (serverState.status !== 'started') {
    return
  }

  const activePlayer = gameState.players[gameState.turnIdx]
  const seatIdx = serverState.startingSeats.indexOf(gameState.whoseTurn)
  if (seatIdx < 0) {
    throw new Error('Could not find active seat in seating chart')
  }
  const nextSeatIdx = (seatIdx + 1) % gameState.numPlayers
  const nextSeat = serverState.startingSeats[nextSeatIdx]

  function rotatePlayer() {
    gameState.whoseTurn = nextSeat
    gameState.turnIdx = seatToIdx(nextSeat)
  }

  if (gameState.missions.length) {
    if (move.type === 'hint') {
      pendingHints[move.guid] = move.hint
      return
    }

    if (move.type !== 'draft') {
      return
    }

    if (move.id === 'pass') {
      activePlayer.passesRemaining--
      rotatePlayer()
      return
    }

    const missionIdx = gameState.missions.findIndex((m) => m.id === move.id)
    if (missionIdx < 0) {
      return
    }

    const mission = { ...gameState.missions.splice(missionIdx, 1)[0] }
    if (move.x) {
      mission.secretX = move.x
      if (mission.xIsPublic || activePlayer.guid === guid) {
        mission.x = move.x
      }
    }
    activePlayer.missions.push(mission)
    if (gameState.missions.length) {
      rotatePlayer()
    } else {
      gameState.whoseTurn = gameState.captainSeat
      gameState.turnIdx = seatToIdx(gameState.captainSeat)
      flushMoveQueue(gameState, serverState)
    }
    return
  }

  if (move.type === 'hint') {
    if (gameState.activeTrick.index >= 0) {
      pendingHints[move.guid] = move.hint
      return
    }

    const hintGuid = move.guid
    const player = gameState.players.find((p) => p.guid === hintGuid)
    if (!player) {
      return
    }

    if (move.hint && !player.hand.includes(move.hint.card)) {
      return
    }

    player.hint = move.hint
    return
  }

  if (move.type === 'play') {
    if (playsUntilUndo !== undefined) {
      if (gameState.activeTrick.cards.length === 0) {
        if (playsUntilUndo <= gameState.numPlayers) {
          return
        }
      }
    }

    gameState.activeTrick.cards.push({
      card: move.card,
      position: activePlayer.seat,
    })
    activePlayer.hand.splice(activePlayer.hand.indexOf(move.card), 1)
    if (activePlayer.hint?.card === move.card) {
      activePlayer.hint.played = true
    }

    if (gameState.activeTrick.cards.length === gameState.numPlayers) {
      const winnerCard = findWinner(gameState.activeTrick.cards)
      const winnerIdx = seatToIdx(winnerCard.position)
      const winner = gameState.players[winnerIdx]
      winner.tricks.push(gameState.activeTrick)
      gameState.previousTrick = { ...gameState.activeTrick }
      gameState.activeTrick = {
        cards: [],
        index: gameState.activeTrick.index + 1,
      }
      gameState.turnIdx = winnerIdx
      gameState.whoseTurn = winner.seat
      flushMoveQueue(gameState, serverState)
      updateMissionStatuses(gameState)
    } else {
      rotatePlayer()
    }
    return
  }

  if (move.type === 'undo') {
    gameState.undoUsed = true
    return
  }
}

function initializeGameState(gameState: GameState) {
  const serverState = atomStore.get(serverStateAtom)
  const { seed1, seed2, seed3, seed4 } = serverState
  setSeeds(seed1, seed2, seed3, seed4)

  const shuffledCards = shuffle(cards)
  const shuffledMissions = shuffle(missions)

  const activeSeats = serverState.startingSeats
  const totalTricks = Math.floor(cards.length / activeSeats.length)
  const players: Player[] = []

  gameState.activeTrick = {
    cards: [],
    index: 0,
  }
  gameState.previousTrick = {
    cards: [],
    index: -1,
  }
  gameState.totalTricks = totalTricks
  gameState.missions = allocateMissions(shuffledMissions, activeSeats.length)
  gameState.players = players
  gameState.numPlayers = activeSeats.length

  let cardIdx = 0
  let captainFound = false
  for (let i = 1; i <= 5; i++) {
    const seat = `seat${i}` as SeatKey
    const [currGuid, name] = serverState[seat].split(':', 2)

    let endIdx = cardIdx + totalTricks
    const player: Player = {
      ...cloneEmptyPlayer(seat),
      name: name || '',
      idx: i,
      guid: currGuid,
      hand: currGuid ? shuffledCards.slice(cardIdx, endIdx) : [],
    }

    if (player.hand.includes('s4')) {
      captainFound = true
      gameState.captainSeat = seat
      gameState.whoseTurn = seat
      gameState.turnIdx = i - 1

      if (activeSeats.length === 3) {
        player.hand.push(shuffledCards[endIdx])
        endIdx++
      }
    }

    if (currGuid) {
      cardIdx = endIdx
      player.hand.sort()
    }

    players.push(player)
  }

  if (!captainFound) {
    gameState.captainSeat = serverState.startingSeats[0]
    gameState.whoseTurn = gameState.captainSeat
    gameState.turnIdx = seatToIdx(gameState.captainSeat)
    const captain = gameState.players[gameState.turnIdx]
    captain.hand.push('s4')
    console.log('appointed captain', captain)
  }

  console.log('game-state', gameState)

  const playsUntilUndo = moves.map(() => 0)
  let playCounter = gameState.numPlayers + 1
  for (let i = moves.length - 1; i >= 0; i--) {
    const move = moves[i]
    if (move.type === 'undo') {
      playCounter = 0
    }

    playsUntilUndo[i] = playCounter

    if (move.type === 'play') {
      playCounter++
    }
  }

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    applyMove(move, gameState, serverState, playsUntilUndo[i])
  }

  atomStore.set(gameStateAtom, gameState)
}

function handleMsg(msg: any) {
  console.log(`Received msg type: ${msg.type}`)
  switch (msg.type) {
    case 'game': {
      const rawState = msg.gameState
      const {
        seed1,
        seed2,
        seed3,
        seed4,
        status,
        seat1,
        seat2,
        seat3,
        seat4,
        seat5,
      } = rawState
      const startingSeats =
        rawState.startingSeats === '' ? [] : rawState.startingSeats.split(',')

      const serverState = atomStore.get(serverStateAtom)
      const needsInitialize =
        status === 'started' && serverState.status === 'waiting'
      const newServerState: ServerGameState = {
        seed1: Number(seed1),
        seed2: Number(seed2),
        seed3: Number(seed3),
        seed4: Number(seed4),
        status,
        seat1,
        seat2,
        seat3,
        seat4,
        seat5,
        meta: rawState.meta ? JSON.parse(rawState.meta) : {},
        startingSeats,
      }
      atomStore.set(serverStateAtom, newServerState)

      const gameState = { ...atomStore.get(gameStateAtom) }
      for (let i = 0; i < 5; i++) {
        const seatKey = `seat${i + 1}` as SeatKey
        const [guid, name] = newServerState[seatKey].split(':', 2)
        gameState.players[i].name = name
        gameState.players[i].guid = guid
      }

      if (needsInitialize) {
        initializeGameState(gameState)
      }
      break
    }
    case 'moves': {
      moves = msg.moves.map((msg: string) => parseMove(msg))
      break
    }
    case 'move': {
      const parsed = parseMove(`${msg.guid}:${msg.move}`)
      if (parsed) {
        moves.push(parsed)
        const gameState = { ...atomStore.get(gameStateAtom) }

        if (parsed.type === 'undo') {
          initializeGameState(gameState)
        } else {
          applyMove(parsed, gameState, atomStore.get(serverStateAtom))
          atomStore.set(gameStateAtom, gameState)
        }
      }
    }
  }
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
