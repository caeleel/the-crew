"use client"

import { ReactNode, useEffect, useState } from "react"
import { cards, Hand } from "./cards"
import { missions, Mission, MissionCard } from "./missions"
import { Move, parseMove, serializeMove } from "./move"
import { shuffle, setSeeds } from "./rand"
import { Provider, useAtom, useAtomValue } from "jotai"
import { joined, SeatKey, Player, numJoined, ServerGameState } from "./game"
import { setLocalStorage } from "./local-storage"
import { socket, send, connect, guid } from "./ws"
import {
  serverStateAtom,
  gameStateAtom,
  nameAtom,
  atomStore,
  emptyPlayer,
} from "./atoms"

let moves: Move[] = []
let currentTarget = 12
const slotDims = "w-80 h-96"

function Slot({
  highlighted,
  children,
}: {
  highlighted?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={`${highlighted ? "border-4 border-emerald-200" : "border"} rounded-md ${slotDims} flex items-center justify-center`}
    >
      {children}
    </div>
  )
}

function Button({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <div
      className="border rounded-md px-4 py-2 cursor-pointer"
      onClick={onClick}
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
      <div>
        <div className="font-medium">{player.name}</div>
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
          type: "join",
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

  if (!player.name) {
    return null
  }

  return (
    <div className={`${slotDims} p-4 flex flex-col gap-2`}>
      <div>
        {player.seat === gameState.captainSeat && "👑"} {player.name}
      </div>
      <Hand hand={player.hand} showBack={player.guid !== guid} showNumber />
    </div>
  )
}

function Seat({ player }: { player: Player }) {
  const serverState = useAtomValue(serverStateAtom)
  const gameState = useAtomValue(gameStateAtom)

  const started = serverState.status === "started"

  return (
    <Slot highlighted={started && gameState.whoseTurn === player.seat}>
      {!started && <PreGameSeat player={player} />}
      {started && <PlayingSeat player={player} />}
    </Slot>
  )
}

function MissionPicker() {
  const gameState = useAtomValue(gameStateAtom)
  const serverState = useAtomValue(serverStateAtom)

  if (!gameState.missions.length) {
    return null
  }

  const isActivePlayer = serverState[gameState.whoseTurn].split(":")[0] === guid

  return (
    <div className="flex w-72 gap-4 flex-wrap p-2 justify-center">
      {gameState.missions.map((mission) => (
        <MissionCard
          key={mission.id}
          mission={mission}
          isActivePlayer={isActivePlayer}
          numPlayers={gameState.numPlayers}
        />
      ))}
      {isActivePlayer && <Button onClick={() => {}}>Pass</Button>}
    </div>
  )
}

function Table() {
  const [name, setName] = useAtom(nameAtom)
  const serverState = useAtomValue(serverStateAtom)

  if (serverState.status === "started" || !guid) {
    return <MissionPicker />
  }

  if (joined(guid, serverState)) {
    if (numJoined(serverState) >= 3) {
      return (
        <Button
          onClick={() => {
            send({
              type: "start",
              meta: { target: currentTarget },
            })
          }}
        >
          Start game
        </Button>
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
        setLocalStorage("name", newName)
      }}
    />
  )
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

function applyMove(move: Move) {}

function initializeGameState() {
  const serverState = atomStore.get(serverStateAtom)
  const { seed1, seed2, seed3, seed4 } = serverState
  setSeeds(seed1, seed2, seed3, seed4)

  const shuffledCards = shuffle(cards)
  const shuffledMissions = shuffle(missions)

  const activeSeats = serverState.startingSeats
  const totalTricks = Math.floor(cards.length / activeSeats.length)
  const players: Player[] = []

  const gameState = { ...atomStore.get(gameStateAtom) }
  gameState.totalTricks = totalTricks
  gameState.missions = allocateMissions(shuffledMissions, activeSeats.length)
  gameState.players = players
  gameState.numPlayers = activeSeats.length

  let cardIdx = 0
  for (let i = 1; i <= 5; i++) {
    const seat = `seat${i}` as SeatKey
    const [currGuid, name] = serverState[seat].split(":", 2)

    let endIdx = cardIdx + totalTricks
    const player: Player = {
      ...emptyPlayer,
      name: name || "",
      idx: i,
      seat,
      guid: currGuid,
      hand: currGuid ? shuffledCards.slice(cardIdx, endIdx) : [],
    }

    if (player.hand.includes("s4")) {
      gameState.captainSeat = seat
      gameState.whoseTurn = seat

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

  console.log("game-state", gameState)

  atomStore.set(gameStateAtom, gameState)
}

function handleMsg(msg: any) {
  console.log(`Received msg type: ${msg.type}`)
  switch (msg.type) {
    case "game": {
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
        rawState.startingSeats === "" ? [] : rawState.startingSeats.split(",")

      const serverState = atomStore.get(serverStateAtom)
      const needsInitialize =
        status === "started" && serverState.status === "waiting"
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
        const name = newServerState[seatKey].split(":")[1] || ""
        gameState.players[i].name = name
      }
      atomStore.set(gameStateAtom, gameState)

      if (needsInitialize) {
        initializeGameState()
      }
      break
    }
    case "moves": {
      moves = msg.moves.map((msg: string) => parseMove(msg))
      break
    }
    case "move": {
      const parsed = parseMove(`${msg.guid}:${msg.move}`)
      if (parsed) {
        moves.push(parsed)
      }
    }
  }
}

if (typeof window !== "undefined") {
  const channel = document.location.href.split("#", 2)[1]
  console.log("connecting...")
  connect((msg) => {
    handleMsg(msg)
  }, channel)
}

function PageInner() {
  const gameState = useAtomValue(gameStateAtom)

  return (
    <div className="flex items-center justify-center w-screen h-screen">
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
