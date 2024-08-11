import { sql } from '@vercel/postgres'

export default async function Page({ params }: { params: { slug: string } }) {
  const guid = params.slug
  const games =
    await sql`SELECT mission_id FROM players WHERE player_id = ${guid}`

  const { rows } =
    await sql`SELECT seed1, meta, undo_used, success, updated_at FROM mission_logs WHERE id IN (${games.rows.map((r: any) => r.mission_id).join(', ')}) ORDER BY updated_at DESC`

  console.log('fetching', rows)

  return (
    <div>
      <div>Hello {JSON.stringify(rows)}</div>
      {rows.map((row) => (
        <div>{row.seed1}</div>
      ))}
    </div>
  )
}
