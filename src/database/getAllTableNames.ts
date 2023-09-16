import { getDb } from './db.js'

export const getAllTableNames = async () => {
  const db = getDb()

  const result = (await db.query(`INFO FOR DB;`, {})) as any
  if (!result[0]?.result) {
    console.error('', result)
    console.error('🤷‍♂️ Sorry, but no tables found.')
    console.error('Please check the config')
    console.error('')
    process.exit(1)
  }

  const res: { tables: Record<string, unknown> } = result[0]?.result

  return Object.keys(res.tables)
}
