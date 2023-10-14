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

export const generateClientNode = async (outputFolder: string, tableNames: string[], lib: string) => {
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
      file.write(getRepositoryContent(lib, tableNameFirstUpper))
      file.close()
    }

    const createFileName = resolve(clientTableFolder, `create${tableNameFirstUpper}.ts`)
    if (!existsSync(repoFileName)) {
      const file = createWriteStream(createFileName)
      file.write(getCreateEntityFileContent(lib, tableName, name))
      file.close()
      console.log(` ✅ [${tableName}]: create${tableNameFirstUpper}.ts`)
    } else {
      console.log(` ❎ [${tableName}]: create${tableNameFirstUpper}.ts already exists`)
    }

    const updateFileName = resolve(clientTableFolder, `update${tableNameFirstUpper}.ts`)
    if (!existsSync(repoFileName)) {
      const file = createWriteStream(updateFileName)
      file.write(getUpdateEntityFileContent(lib, tableName))
      file.close()
      console.log(` ✅ [${tableName}]: update${tableNameFirstUpper}.ts`)
    } else {
      console.log(` ❎ [${tableName}]: update${tableNameFirstUpper}.ts already exists`)
    }

    const deleteFileName = resolve(clientTableFolder, `delete${tableNameFirstUpper}.ts`)
    if (!existsSync(repoFileName)) {
      const file = createWriteStream(deleteFileName)
      file.write(getDeleteEntityFileContent(lib, tableName))
      file.close()
      console.log(` ✅ [${tableName}]: delete${tableNameFirstUpper}.ts`)
    } else {
      console.log(` ❎ [${tableName}]: delete${tableNameFirstUpper}.ts already exists`)
    }

    const getAllFileName = resolve(clientTableFolder, `getAll${tableNameFirstUpper}s.ts`)
    if (!existsSync(repoFileName)) {
      const file = createWriteStream(getAllFileName)
      file.write(getAllEntityFileContent(lib, tableName, name))
      file.close()
      console.log(` ✅ [${tableName}]: getAll${tableNameFirstUpper}s.ts`)
    } else {
      console.log(` ❎ [${tableName}]: getAll${tableNameFirstUpper}s.ts already exists`)
    }

    const getByIdFileName = resolve(clientTableFolder, `get${tableNameFirstUpper}ById.ts`)
    if (!existsSync(repoFileName)) {
      const file = createWriteStream(getByIdFileName)
      file.write(getByIdEntityFileContent(lib, tableName))
      file.close()
      console.log(` ✅ [${tableName}]: get${tableNameFirstUpper}ById.ts`)
    } else {
      console.log(` ❎ [${tableName}]: get${tableNameFirstUpper}ById.ts already exists`)
    }
  }
}
