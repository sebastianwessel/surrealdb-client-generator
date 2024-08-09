import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getInsertEntityFileContent = (lib: string, entityName: string, tableName: string) => {
	const entitySchemaName = `${entityName}InsertSchema`
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityInsertTypeName = `${toUpperCamelCase(entityName)}Insert`

	return `
import type { Surreal } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityInsertTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const insert${entityNameFirstUpper} = async function (db: Surreal, ${entityName}: ${entityInsertTypeName}) {
  const payload = ${entitySchemaName}.parse(${entityName});

  const result = await db.insert<${entityInsertTypeName}[0]>("${tableName}", payload);
  
  return result
};
`
}