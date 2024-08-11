import { targetPts } from '../game-logic/game'
import { GameState, seats, ServerGameState } from '../types'

interface Player {
  seat: string
  name: string
}

export async function upsertGame(
  serverState: ServerGameState,
  gameState: Pick<GameState, 'undoUsed' | 'succeeded'> & { completed: boolean },
  moves: string[],
) {
  const players: { [guid: string]: Player } = {}
  const undo_used = gameState.undoUsed
  const completed = gameState.completed
  const success = gameState.succeeded
  const { seed1, seed2, seed3, seed4, meta } = serverState
  if (meta.target === undefined) {
    meta.target = targetPts(serverState)
  }

  for (const seat of seats) {
    const player = serverState[seat]
    if (player) {
      const [guid, name] = player.split(':')
      players[guid] = { name, seat }
    }
  }

  fetch('/api/mission-log', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      seed1,
      seed2,
      seed3,
      seed4,
      meta,
      undo_used,
      completed,
      success,
      moves,
      players,
    }),
  })
}
