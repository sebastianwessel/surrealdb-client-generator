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

async function startSurrealDBContainer(config: Config): Promise<StartedTestContainer> {
	try {
		console.log('Starting temporary SurrealDB instance')
		const newContainer = await new GenericContainer(config.surrealImage)
			.withExposedPorts(8000)
			.withCommand(['start', '--user', config.username, '--pass', config.password, 'memory'])
			.withWaitStrategy(Wait.forLogMessage('Started web server'))
			.start()

		const port = newContainer.getMappedPort(8000)
		const host = newContainer.getHost()
		config.surreal = `http://${host}:${port}`
		console.log(`Temporary SurrealDB instance started at ${config.surreal}`)

		return newContainer
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes('pull access denied') || error.message.includes('not found')) {
				throw new Error(`Invalid or inaccessible Docker image: ${config.surrealImage}`)
			}
			if (error.message.includes('connection refused')) {
				throw new Error('Unable to connect to Docker daemon. Is Docker running?')
			}
		}
		throw new Error(`Failed to start SurrealDB container: ${error}`)
	}
}

export const connectDb = async (config: Config, createInstance = false) => {
	if (createInstance) {
		try {
			container = await startSurrealDBContainer(config)
		} catch (error) {
			console.error('Error starting SurrealDB container:', error instanceof Error ? error.message : error)
			throw error // Re-throw to be caught by the caller if needed
		}
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

	let lastSignInError: unknown
	const signInPayloads: Record<string, string>[] = [
		{
			namespace: config.ns,
			database: config.db,
			username: config.username,
			password: config.password,
		},
		{
			username: config.username,
			password: config.password,
		},
	]

	for (const payload of signInPayloads) {
		try {
			await db.signin(payload)
			lastSignInError = undefined
			break
		} catch (error) {
			lastSignInError = error
		}
	}

	if (lastSignInError) {
		throw lastSignInError
	}

	await db.use({
		namespace: config.ns,
		database: config.db,
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
