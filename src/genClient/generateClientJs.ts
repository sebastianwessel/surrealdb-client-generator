import { createWriteStream, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { mkdirp } from 'mkdirp'

import { toCamelCase } from '../helper/toCamelCase.js'
import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'
import { getAllEntityFileContent } from './getAllEntityFileContent.js'
import { getByIdEntityFileContent } from './getByIdEntityFileContent.js'
import { getCreateEntityFileContent } from './getCreateEntityFileContent.js'
import { getDeleteEntityFileContent } from './getDeleteEntityFileContent.js'
import { getRepositoryContent } from './getRepositoryFileContent.js'
import { getUpdateEntityFileContent } from './getUpdateEntityFileContent.js'

const createIndexFile = (directory: string, files: string[]) => {
	const indexContent = files.map(file => {
		const baseName = file.replace(/\.ts$/, '')
		return `export * from './${baseName}.js';`
	}).join('\n')

	writeFileSync(resolve(directory, 'index.ts'), indexContent)
}

export const generateClientJs = async (outputFolder: string, tableNames: string[], lib: string) => {
	const clientFolder = resolve(outputFolder, 'client')
	await mkdirp(clientFolder)

	const generatedFiles: string[] = []

	for (const name of tableNames) {
		const tableName = toCamelCase(name)
		const tableNameFirstUpper = toUpperCamelCase(tableName)

		const clientTableFolder = resolve(clientFolder, tableName)
		await mkdirp(clientTableFolder)

		console.log(`👉 [${tableName}]: ${clientTableFolder}`)

		const fileOperations = [
			{
				fileName: `get${tableNameFirstUpper}Repository.ts`,
				content: () => getRepositoryContent(lib, tableNameFirstUpper),
			},
			{
				fileName: `create${tableNameFirstUpper}.ts`,
				content: () => getCreateEntityFileContent(lib, tableName, name),
			},
			{
				fileName: `update${tableNameFirstUpper}.ts`,
				content: () => getUpdateEntityFileContent(lib, tableName),
			},
			{
				fileName: `delete${tableNameFirstUpper}.ts`,
				content: () => getDeleteEntityFileContent(lib, tableName),
			},
			{
				fileName: `getAll${tableNameFirstUpper}s.ts`,
				content: () => getAllEntityFileContent(lib, tableName, name),
			},
			{
				fileName: `get${tableNameFirstUpper}ById.ts`,
				content: () => getByIdEntityFileContent(lib, tableName),
			},
		]

		for (const { fileName, content } of fileOperations) {
			const fullFileName = resolve(clientTableFolder, fileName)
			if (!existsSync(fullFileName)) {
				const file = createWriteStream(fullFileName)
				await new Promise<void>((resolve, reject) => {
					file.write(content(), (err) => {
						if (err) {
							console.error(err)
							reject(err)
						} else {
							resolve()
						}
					})
				})
				file.close()
				console.log(` ✅ [${tableName}]: ${fileName}`)
			} else {
				console.log(` ❌ [${tableName}]: ${fileName} already exists`)
			}
		}

		const allTableFiles = fileOperations.map(op => op.fileName)
		createIndexFile(clientTableFolder, allTableFiles)
		console.log(` ✅ [${tableName}]: index.ts created/updated`)

		generatedFiles.push(tableName)
	}

	const mainIndexContent = generatedFiles
		.map(name => `export * from './${name}/index.js';`)
		.join('\n')
	writeFileSync(resolve(clientFolder, 'index.ts'), mainIndexContent)
	console.log(` ✅ Created/Updated main client index.ts`)
}