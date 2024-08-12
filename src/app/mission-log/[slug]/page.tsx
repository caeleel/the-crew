import { MissionLog } from '@/app/types'
import { sql } from '@vercel/postgres'
import { unstable_noStore } from 'next/cache'
import { UnifrakturCook } from 'next/font/google'

const unifraktur = UnifrakturCook({ weight: '700', subsets: ['latin'] })

function Mission({ mission }: { mission: MissionLog }) {
  return (
    <tr>
      <td className="p-2">
        {new Date(Number(mission.updated_at)).toDateString()}
      </td>
      <td className="p-2 text-center">{mission.meta.target}</td>
      <td className="p-2 text-center">
        {Object.values(mission.players)
          .map((p) => p.name)
          .join(', ')}
      </td>
      <td className="p-2 text-center">{mission.success ? '✅' : '🙅'}</td>
    </tr>
  )
}

export default async function Page({ params }: { params: { slug: string } }) {
  unstable_noStore()
  const guid = params.slug
  const games =
    await sql`SELECT mission_id, player_id, seat, name FROM players WHERE player_id = ${guid}`

  const missionQuery = `SELECT id, meta, undo_used, completed, success, updated_at FROM mission_logs WHERE id IN (${games.rows.map((_, i) => `$${i + 1}`).join(', ')}) ORDER BY updated_at DESC`
  const { rows } = await sql.query(
    missionQuery,
    games.rows.map((r) => r.mission_id),
  )

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center my-8">
        <div className="text-2xl my-2">Mission logs</div>
        <div>No missions recorded</div>
      </div>
    )
  }

  const query = `SELECT * FROM players WHERE mission_id IN (${rows.map((_, i) => `$${i + 1}`).join(', ')})`
  const queryParams = rows.map((r) => r.id)

  const players = await sql.query(query, queryParams)
  const playersByMission: {
    [id: string]: { [guid: string]: { seat: string; name: string } }
  } = {}

  for (const row of players.rows) {
    const id = `${row.mission_id}`
    if (!playersByMission[id]) {
      playersByMission[id] = {}
    }

    playersByMission[id][row.player_id] = { seat: row.seat, name: row.name }
  }

  return (
    <div className="flex flex-col items-center my-4">
      <div className="flex gap-4 items-center">
        <div className={`text-2xl my-8 ${unifraktur.className}`}>
          Mission logs
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2">Points</th>
            <th className="p-2">Players</th>
            <th className="p-2">Won</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <Mission
              key={row.id}
              mission={{ ...row, players: playersByMission[row.id] }}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
