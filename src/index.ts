#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { program } from 'commander'

import { configFileSchema } from './config/configFileSchema.js'
import { closeDb, connectDb, insertDefinitions } from './database/db.js'
import { getAllTableInfo } from './database/getAllTableInfo.js'
import { generateClientJs } from './genClient/generateClientJs.js'
import { generateTableSchema } from './genSchema/generateTableSchema.js'
import { printSorry } from './helper/printSorry.js'

const main = async () => {
	program
		.name('surql-gen')
		.description('Generate zod schema and typescript client code from running Surreal database or schema file')
		.version('1.0.0')

	program
		.option('-f, --schemaFile [schemaFile]', 'a SurrealQL file containing the definitions')
		.option('-c, --config [config]', 'config file', 'surql-gen.json')
		.option('-s, --surreal [surreal]', 'SurrealDB connection url', 'http://localhost:8000')
		.option('-u, --username [username]', 'auth username', 'root')
		.option('-p, --password [password]', 'auth password', 'root')
		.option('-n, --ns [ns]', 'the namespace', 'test')
		.option('-d, --db [db]', 'the database', 'test')
		.option('-o, --outputFolder [outputFolder]', 'output folder', 'client_generated')
		.option('-g, --generateClient', 'generate client', true)
		.option('--no-generateClient', 'no client generation')
		.option('-i, --surrealImage [surrealImage]', 'SurrealDB image', 'surrealdb/surrealdb:latest')

	program.parse()

	const options = program.opts()
	const __dirname = process.cwd()

	if (!options.config) {
		console.log('No config file specified - looking for surql-gen.json in current folder')
	}

	const configFilePath = resolve(__dirname, options.config || 'surql-gen.json')

	let fileContent: Record<string, unknown> = {}
	try {
		const content = await readFile(configFilePath)
		fileContent = JSON.parse(content.toString())
	} catch (error) {
		const err = error as Error & { code?: string }
		if (options.config !== 'surql-gen.json' && err.code === 'ENOENT') {
			console.error('Unable to find config file', configFilePath)
			process.exit(1)
		}
		if (err.code === 'ENOENT') {
			console.log('No config file found.')
		} else {
			console.error('')
			console.error('Please have a look at your config file!')
			console.error('Looks like, your configuration file is invalid.')
			console.error('')
			throw new Error(`Invalid configuration: ${err.message}`)
		}
	}

	const config = configFileSchema.parse({ ...options, ...fileContent })

	try {
		if (config.schemaFile) {
			await connectDb(config, true)
			const schemaFilePath = resolve(__dirname, config.schemaFile)
			let schemaContent: string
			try {
				schemaContent = await readFile(schemaFilePath, 'utf-8')
			} catch (error) {
				const err = error as Error & { code?: string }
				if (err.code === 'ENOENT') {
					console.error('')
					console.error('Unable to find schema file', schemaFilePath)
					console.error('Please check!')
					console.error('')
					process.exit(1)
				} else {
					throw new Error(`Error reading schema file: ${err.message}`)
				}
			}

			try {
				await insertDefinitions(schemaContent)
			} catch (error) {
				printSorry(error)
				process.exit(1)
			}
		} else {
			await connectDb(config)
		}

		const tableInfo = await getAllTableInfo()

		await generateTableSchema(resolve(__dirname, config.outputFolder), tableInfo)

		if (config.generateClient) {
			await generateClientJs(resolve(__dirname, config.outputFolder), Object.keys(tableInfo), 'surrealdb')
		}
	} catch (error) {
		printSorry(error)
		process.exit(1)
	} finally {
		await closeDb()
	}

	console.log('')
	console.log('')
	console.log('Thanks for using my tool')
	console.log('')
	console.log('Please 🙏 give a star ⭐️ on github: 👉 https://github.com/sebastianwessel/surrealdb-client-generator')
	console.log('')
	console.log('If you run into an issue, please let me know so it can get fixed.')
	console.log('👉 https://github.com/sebastianwessel/surrealdb-client-generator/issues')
	console.log('')
	console.log('Good luck with your project. 👋 Cheers, and happy coding!')
	console.log('')

	process.exit()
}

main()
