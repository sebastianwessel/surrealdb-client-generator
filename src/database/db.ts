import { Surreal } from 'surrealdb'
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers'

import type { Config } from '../config/types.js'

let db: Surreal
let container: StartedTestContainer | null = null

export const getDb = () => {
	if (db) {
		return db
	}
	throw new Error('Not connected to a database')
}

export const connectDb = async (config: Config, createInstance = false) => {
	if (createInstance) {
		console.log('Starting temporary SurrealDB instance')
		container = await new GenericContainer('surrealdb/surrealdb:latest')
			.withExposedPorts(8000)
			.withCommand(['start', '--user', config.username, '--pass', config.password, 'memory'])
			.withWaitStrategy(Wait.forLogMessage('Started web server'))
			.start()

		const port = container.getMappedPort(8000)
		const host = container.getHost()
		config.surreal = `http://${host}:${port}`
		console.log(`Temporary SurrealDB instance started at ${config.surreal}`)
	}

	console.log('Connecting to database')
	db = new Surreal()

	let retries = 5
	while (retries > 0) {
		try {
			await db.connect(config.surreal)
			break
		} catch (error) {
			console.log(`Connection failed. Retrying... (${retries} attempts left)`)
			retries--
			if (retries === 0) {
				throw error
			}
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
	}

	await db.use({
		namespace: config.ns,
		database: config.db,
	})
	await db.signin({
		username: config.username,
		password: config.password,
	})
	console.log('Connected to database successfully')
}

export const insertDefinitions = async (content: string) => {
	const db = getDb()
	await db.query(content, {})
	console.log('Definitions written to database')
}

export const closeDb = async () => {
	if (db) {
		await db.close()
	}
	if (container) {
		await container.stop()
		console.log('Temporary SurrealDB instance stopped')
	}
	console.log('Database connection closed')
}
