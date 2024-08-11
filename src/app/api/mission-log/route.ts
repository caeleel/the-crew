import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

interface MissionLog {
  seed1: number
  seed2: number
  seed3: number
  seed4: number
  success: boolean
  completed: boolean
  undo_used: boolean
  meta: { target: number }
  created_at: number
  updated_at: number
  moves: string[]
  players: {
    [guid: string]: {
      seat: string
      name: string
    }
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MissionLog

    const { seed1, seed2, seed3, seed4, success, completed, undo_used } =
      payload
    const meta = JSON.stringify(payload.meta)
    const created_at = Date.now()
    const updated_at = created_at
    const moves = `{${payload.moves.map((m) => `"${m}"`).join(', ')}}`

    let missionResult =
      await sql`UPDATE mission_logs SET meta = ${meta},  moves = ${moves}, success = ${success}, completed = ${completed}, undo_used = ${undo_used}, updated_at = ${Date.now()} WHERE seed1 = ${seed1} AND seed2 = ${seed2} AND seed3 = ${seed3} AND seed4 = ${seed4} RETURNING *`
    const players: any[] = []

    if (missionResult.rowCount === 0) {
      missionResult =
        await sql`INSERT INTO mission_logs (seed1, seed2, seed3, seed4, success, completed, undo_used, meta, created_at, updated_at, moves) VALUES (${seed1}, ${seed2}, ${seed3}, ${seed4}, ${success}, ${completed}, ${undo_used}, ${meta}, ${created_at}, ${updated_at}, ${moves}) RETURNING *`

      const missionId = missionResult.rows[0].id

      for (const guid in payload.players) {
        const { name, seat } = payload.players[guid]
        const { rows } =
          await sql`INSERT INTO players (mission_id, player_id, seat, name) VALUES (${missionId}, ${guid}, ${seat}, ${name}) RETURNING *`
        players.push(rows[0])
      }
    }

    return NextResponse.json(
      { mission: missionResult.rows[0], players },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
}
