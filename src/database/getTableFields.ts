import { getDb } from './db.js'

type InfoTable = {
	events: Record<string, unknown>
	fields: Record<string, string>
	indexes: Record<string, unknown>
	lives: Record<string, unknown>
	tables: Record<string, unknown>
}[]

export const getTableFields = async (tableName: string) => {
	const db = getDb()

	const result = await db.query<InfoTable>(`INFO FOR TABLE ${tableName};`, {})

	return result[0]?.fields ?? {}
}
