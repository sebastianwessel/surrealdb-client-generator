import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getCreateEntityFileContent = (entityName: string, tableName: string) => {
  const entitySchemaName = `${entityName}CreateSchema`
  const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
  const entityTypeName = `${toUpperCamelCase(entityName)}`
  const entityCreateTypeName = `${toUpperCamelCase(entityName)}Create`

  return `
import type { Surreal } from "surrealdb.js";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityTypeName}, ${entityCreateTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const create${entityNameFirstUpper} = async function (db: Surreal, ${entityName}: ${entityCreateTypeName}) {
  const payload = ${entitySchemaName}.parse(${entityName});

  const result = await db.query<[${entityTypeName}]>("CREATE ONLY ${tableName} CONTENT $payload", { payload });

  if(result[0].status==="ERR") {
    throw new Error('[DB_ERR] '+result[0].result)
  }

  return result[0].result as ${entityTypeName};
};
`
}
