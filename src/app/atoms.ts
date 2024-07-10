import { atom, createStore } from "jotai"
import { GameState, Player, ServerGameState } from "./game"
import { getLocalStorage } from "./local-storage"

export const emptyPlayer: Player = {
  name: "",
  hand: [],
  missions: [],
  hint: null,
  tricks: [],
  idx: 0,
  guid: "",
  seat: "seat1",
}

export const atomStore = createStore()
export const serverStateAtom = atom<ServerGameState>({
  seed1: 0,
  seed2: 0,
  seed3: 0,
  seed4: 0,
  seat1: "",
  seat2: "",
  seat3: "",
  seat4: "",
  seat5: "",
  meta: {
    target: 12,
  },
  startingSeats: [],
  status: "waiting",
})
export const gameStateAtom = atom<GameState>({
  players: [
    {
      ...emptyPlayer,
    },
    {
      ...emptyPlayer,
      seat: "seat2",
    },
    {
      ...emptyPlayer,
      seat: "seat3",
    },
    {
      ...emptyPlayer,
      seat: "seat4",
    },
    {
      ...emptyPlayer,
      seat: "seat5",
    },
  ],
  activeTrick: [],
  numPlayers: 0,
  captainSeat: "seat1",
  missions: [],
  whoseTurn: "seat1",
  totalTricks: 0,
})

let name = getLocalStorage("name") || ""
export const nameAtom = atom(name)
