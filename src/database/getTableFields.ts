import { getDb } from './db.js'

export const getTableFields = async (tableName: string) => {
  const db = getDb()

  const result = (await db.query(`INFO FOR TABLE ${tableName};`, {})) as any
  const res: { fields: Record<string, string> } = result[0]?.result

  return res.fields
}
