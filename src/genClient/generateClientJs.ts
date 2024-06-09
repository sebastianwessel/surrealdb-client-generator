import { createWriteStream, existsSync } from 'node:fs'
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

export const generateClientJs = async (outputFolder: string, tableNames: string[], lib: string) => {
	const clientFolder = resolve(outputFolder, 'client')

	for (const name of tableNames) {
		const tableName = toCamelCase(name)
		const tableNameFirstUpper = toUpperCamelCase(tableName)

		const clientTableFolder = resolve(clientFolder, tableName)
		await mkdirp(clientTableFolder)

		console.log(`👉 [${tableName}]: ${clientTableFolder}`)

		const repoFileName = resolve(clientTableFolder, `get${tableNameFirstUpper}Repository.ts`)
		if (!existsSync(repoFileName)) {
			const file = createWriteStream(repoFileName)
			await new Promise((resolve, reject) =>
				file.write(getRepositoryContent(lib, tableNameFirstUpper), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
		}

		const createFileName = resolve(clientTableFolder, `create${tableNameFirstUpper}.ts`)
		if (!existsSync(createFileName)) {
			const file = createWriteStream(createFileName)
			await new Promise((resolve, reject) =>
				file.write(getCreateEntityFileContent(lib, tableName, name), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
			console.log(` ✅ [${tableName}]: create${tableNameFirstUpper}.ts`)
		} else {
			console.log(` ❌ [${tableName}]: create${tableNameFirstUpper}.ts already exists`)
		}

		const updateFileName = resolve(clientTableFolder, `update${tableNameFirstUpper}.ts`)
		if (!existsSync(updateFileName)) {
			const file = createWriteStream(updateFileName)
			await new Promise((resolve, reject) =>
				file.write(getUpdateEntityFileContent(lib, tableName), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
			console.log(` ✅ [${tableName}]: update${tableNameFirstUpper}.ts`)
		} else {
			console.log(` ❌ [${tableName}]: update${tableNameFirstUpper}.ts already exists ${updateFileName}`)
		}

		const deleteFileName = resolve(clientTableFolder, `delete${tableNameFirstUpper}.ts`)
		if (!existsSync(deleteFileName)) {
			const file = createWriteStream(deleteFileName)
			await new Promise((resolve, reject) =>
				file.write(getDeleteEntityFileContent(lib, tableName), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
			console.log(` ✅ [${tableName}]: delete${tableNameFirstUpper}.ts`)
		} else {
			console.log(` ❌ [${tableName}]: delete${tableNameFirstUpper}.ts already exists`)
		}

		const getAllFileName = resolve(clientTableFolder, `getAll${tableNameFirstUpper}s.ts`)
		if (!existsSync(getAllFileName)) {
			const file = createWriteStream(getAllFileName)
			await new Promise((resolve, reject) =>
				file.write(getAllEntityFileContent(lib, tableName, name), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
			console.log(` ✅ [${tableName}]: getAll${tableNameFirstUpper}s.ts`)
		} else {
			console.log(` ❌ [${tableName}]: getAll${tableNameFirstUpper}s.ts already exists`)
		}

		const getByIdFileName = resolve(clientTableFolder, `get${tableNameFirstUpper}ById.ts`)
		if (!existsSync(getByIdFileName)) {
			const file = createWriteStream(getByIdFileName)
			await new Promise((resolve, reject) =>
				file.write(getByIdEntityFileContent(lib, tableName), err => {
					if (err) {
						console.error(err)
						reject(err)
					} else {
						resolve(true)
					}
				}),
			)
			file.close()
			console.log(` ✅ [${tableName}]: get${tableNameFirstUpper}ById.ts`)
		} else {
			console.log(` ❌ [${tableName}]: get${tableNameFirstUpper}ById.ts already exists`)
		}
	}
}
