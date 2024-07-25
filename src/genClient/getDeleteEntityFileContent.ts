import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getDeleteEntityFileContent = (lib: string, entityName: string, jsImport = true) => {
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`

	return `
import { type Surreal, RecordId } from "${lib}";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types${jsImport ? '.js':''}";

export const delete${entityNameFirstUpper} = async function (db: Surreal, id: RecordId) {
  return db.delete<${entityTypeName}>(id)
};
`
}
