import { Surreal } from 'surrealdb.js'

import type { Config } from '../config/types.js'

let db: Surreal

export const getDb = () => {
	if (db) {
		return db
	}
	throw new Error('Not connected to a database')
}

export const connectDb = async (config: Config) => {
	console.log('connect to database')
	db = new Surreal()
	await db.connect(config.surreal)
	await db.use({
		namespace: config.ns,
		database: config.db,
	})
	await db.signin({
		username: config.username,
		password: config.password,
	})
}

export const insertDefinitions = async (content: string) => {
	const db = getDb()
	const _result = await db.query(content, {})
	console.log('definitions written to database')
}

export const closeDb = async () => {
	console.log('database closed')
}
