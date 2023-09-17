import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getDeleteEntityFileContent = (entityName: string) => {
  const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
  const entityTypeName = `${toUpperCamelCase(entityName)}`
  const entitySchemaName = `${entityName}Schema`

  return `
import type { Surreal } from "surrealdb.js";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";
import type { PropType } from '../../PropType.ts'

export const delete${entityNameFirstUpper} = async function (db: Surreal, id: PropType<${entityNameFirstUpper}, "id">) {
  const key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const result = await db.query<[${entityTypeName}[]]>("DELETE " + key.id, {});

  if(result[0].status==="ERR") {
    throw new Error('[DB_ERR] '+result[0].result)
  }
};
`
}
