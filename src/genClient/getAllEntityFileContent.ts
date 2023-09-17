import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getAllEntityFileContent = (entityName: string, tableName: string) => {
  const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
  const entityTypeName = `${toUpperCamelCase(entityName)}`

  return `
import type { Surreal } from "surrealdb.js";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const getAll${entityNameFirstUpper}s = async function (db: Surreal) {

  const result = await db.query<[${entityTypeName}[]]>("SELECT * FROM ${tableName}", {});

  if(result[0].status==="ERR") {
    throw new Error('[DB_ERR] '+result[0].result)
  }

  return result[0].result;
};
`
}
