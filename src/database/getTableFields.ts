import { getDb } from './db.js'

export const getTableFields = async (tableName: string) => {
	const db = getDb()

	const result = await db.query(`INFO FOR TABLE ${tableName};`, {})
	const res: { fields: Record<string, string> } = result[0]

	return res.fields
}
