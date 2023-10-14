import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getAllEntityFileContent = (lib: string, entityName: string, tableName: string) => {
  const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
  const entityTypeName = `${toUpperCamelCase(entityName)}`

  return `
import type { Surreal } from "${lib}";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const getAll${entityNameFirstUpper}s = async function (db: Surreal) {

  const result = await db.query("SELECT * FROM ${tableName}", {});

  return result[0] as ${entityTypeName}[];
};
`
}
