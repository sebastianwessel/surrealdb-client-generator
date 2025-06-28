import { toUpperCamelCase } from '../helper/toUpperCamelCase'

export const getAllEntityFileContent = (lib: string, entityName: string, tableName: string) => {
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`

	return `
import type { Surreal } from "${lib}";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types";

export const getAll${entityNameFirstUpper}s = async function (db: Surreal) {
  return db.select<${entityTypeName}>("${tableName}")
};
`
}
