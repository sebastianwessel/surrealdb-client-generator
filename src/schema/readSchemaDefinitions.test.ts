import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { readSchemaDefinitions } from './readSchemaDefinitions.js'

describe('readSchemaDefinitions', () => {
	let tempDir = ''

	afterEach(async () => {
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true })
			tempDir = ''
		}
	})

	it('reads a single schema file', async () => {
		tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-schema-'))
		const schemaFilePath = resolve(tempDir, 'schema.surql')
		await writeFile(schemaFilePath, 'DEFINE TABLE user SCHEMAFULL;')

		const content = await readSchemaDefinitions(schemaFilePath)
		expect(content).toBe('DEFINE TABLE user SCHEMAFULL;')
	})

	it('reads schema files recursively from a directory', async () => {
		tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-schema-'))
		await mkdir(resolve(tempDir, 'nested'), { recursive: true })
		await writeFile(resolve(tempDir, 'a.surql'), 'DEFINE TABLE a SCHEMAFULL;')
		await writeFile(resolve(tempDir, 'nested', 'b.surql'), 'DEFINE TABLE b SCHEMAFULL;')

		const content = await readSchemaDefinitions(tempDir)
		expect(content).toContain('DEFINE TABLE a SCHEMAFULL;')
		expect(content).toContain('DEFINE TABLE b SCHEMAFULL;')
	})

	it('respects .ignore patterns', async () => {
		tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-schema-'))
		await mkdir(resolve(tempDir, 'ignored'), { recursive: true })
		await mkdir(resolve(tempDir, 'included'), { recursive: true })
		await writeFile(resolve(tempDir, '.ignore'), 'ignored/**\nexcluded.surql\n')
		await writeFile(resolve(tempDir, 'ignored', 'skip.surql'), 'DEFINE TABLE skip SCHEMAFULL;')
		await writeFile(resolve(tempDir, 'excluded.surql'), 'DEFINE TABLE excluded SCHEMAFULL;')
		await writeFile(resolve(tempDir, 'included', 'keep.surql'), 'DEFINE TABLE keep SCHEMAFULL;')

		const content = await readSchemaDefinitions(tempDir)
		expect(content).toContain('DEFINE TABLE keep SCHEMAFULL;')
		expect(content).not.toContain('DEFINE TABLE skip SCHEMAFULL;')
		expect(content).not.toContain('DEFINE TABLE excluded SCHEMAFULL;')
	})

	it('ignores non schema files', async () => {
		tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-schema-'))
		await writeFile(resolve(tempDir, 'schema.txt'), 'DEFINE TABLE nope SCHEMAFULL;')
		await writeFile(resolve(tempDir, 'schema.surql'), 'DEFINE TABLE yep SCHEMAFULL;')

		const content = await readSchemaDefinitions(tempDir)
		expect(content).toContain('DEFINE TABLE yep SCHEMAFULL;')
		expect(content).not.toContain('DEFINE TABLE nope SCHEMAFULL;')
	})

	it('throws if directory has no schema files', async () => {
		tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-schema-'))
		await writeFile(resolve(tempDir, '.ignore'), '# no schema files')

		await expect(readSchemaDefinitions(tempDir)).rejects.toThrow('No schema files found in directory')
	})
})
