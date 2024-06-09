import { getDb } from './db.js'

export const getAllTableNames = async () => {
	const db = getDb()

	type InfoDB = {
		analyzers: Record<string, unknown>
		functions: Record<string, unknown>
		models: Record<string, unknown>
		params: Record<string, unknown>
		scopes: Record<string, unknown>
		tables: Record<string, string>
		tokens: Record<string, unknown>
		users: Record<string, unknown>
	}[]

	const result = await db.query<InfoDB>('INFO FOR DB;', {})
	if (!result[0]?.tables) {
		console.error('', result)
		console.error('🤷‍♂️ Sorry, but no tables found.')
		console.error('Please check the config')
		console.error('')
		process.exit(1)
	}

	const res: { tables: Record<string, unknown> } = result[0]

	return Object.keys(res.tables)
}
