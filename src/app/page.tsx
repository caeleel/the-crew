'use client';

import { useEffect } from "react";
import { cards, CardValue, Trick, Hint } from './cards'
import { missions, Mission } from './missions'
import { Move, parseMove, serializeMove } from './move'

type Seats = {
  [guid: string]: {
    idx: number
    name: string
  }
}

interface GameState {
  seed1: number
  seed2: number
  seed3: number
  seed4: number
  seats: Seats
  startingSeats: string[]
  status: 'started' | 'waiting'
}

interface ComputedState {
  captainIdx: number
  missions: Mission[]
  activeTrick: CardValue[]
}

interface Player {
  guid: string
  name: string
  hand: CardValue[]
  missions: Mission[]
  hint: Hint
  tricks: (Trick | null)[]
  idx: number
  seat: string
  occupied: boolean
}

let players: Player[] = []

function getLocalStorage(key: string) {
  if (typeof window === undefined) {
    return null
  }

  return window.localStorage.getItem(key)
}

function setLocalStorage(key: string, val: string) {
  if (typeof window === undefined) {
    return
  }

  window.localStorage.setItem(key, val)
}

let moves: Move[] = []
let name = getLocalStorage('name') || ''
let socket: WebSocket | null = null
let gameState: GameState = {
  seed1: 0,
  seed2: 0,
  seed3: 0,
  seed4: 0,
  seats: {},
  startingSeats: [],
  status: 'waiting',
}
let guid = getLocalStorage('guid')

if (!guid) {
  guid = crypto.randomUUID()
  setLocalStorage('guid', guid)
}

function joined() {
  return !!guid && !!gameState.seats[guid]
}

function send(data: any) {
  socket!.send(JSON.stringify(data))
}

function connect(callback: (msg: any) => void, channel?: string) {
  if (!channel) {
    return
  }

  socket = new WebSocket("wss://splendorlord.xyz/the-crew")

  socket.onopen = () => {
    send({
      type: 'subscribe',
      channel,
    })
  }

  socket.onclose = (e) => {
    setTimeout(() => {
      connect(callback, channel)
    }, 1000)
  }

  socket.onerror = (e) => {
    socket!.close()
  }

  socket.onmessage = (e) => {
    callback(JSON.parse(e.data))
  }
}

function Button({ text, onClick }: { text: string, onClick: () => void }) {
  return <div className="border rounded-md px-4 py-2 cursor-pointer" onClick={onClick}>
    {text}
  </div>
}

function PreGameSeat({ player, }: { player: Player }) {
  if (player.occupied) {
    return <div>
      <div className="font-medium">{player.name}</div>
    </div>
  }

  if (!socket) {
    return null
  }

  return <Button text="Sit here" onClick={() => {
    send({
      type: 'join',
      seat: player.seat,
    })
  }} />
}

function Seat({ player }: { player: Player }) {
  if (gameState.status === 'waiting') {
    return <PreGameSeat player={player} />
  }
}

function handleMsg(msg: any) {
  switch (msg.type) {
    case 'game': {
      const rawState = msg.gameState
      const { seed1, seed2, seed3, seed4, status } = rawState
      const startingSeats = rawState.startingSeats === '' ? [] : rawState.startingSeats.split(',')
      const seats: Seats = {}
      for (let i = 1; i <= 5; i++) {
        const seatKey = `seat${i}`
        const seat = rawState[seatKey]

        if (seat) {
          const [guid, name] = seat.split(':')
          seats[guid] = {
            idx: i - 1,
            name,
          }
        }
      }
      for (let i = 0; i < startingSeats.length; i++) {
        startingSeats[i] = rawState[startingSeats[i]]
      }

      gameState = { ...gameState, seed1, seed2, seed3, seed4, status, seats, startingSeats }
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
      }
    }
  }
}

export default function Page() {
  const channel = document.location.href.split('#', 2)[1]

  useEffect(() => {
    console.log('connecting...')
    connect((msg) => {
      console.log(msg)
    }, channel)
  }, [channel])
}