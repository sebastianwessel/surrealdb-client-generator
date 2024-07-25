import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getCreateEntityFileContent = (lib: string, entityName: string, tableName: string, jsImport = true) => {
	const entitySchemaName = `${entityName}CreateSchema`
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`
	const entityCreateTypeName = `${toUpperCamelCase(entityName)}Create`

	return `
import type { Surreal } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema${jsImport ? '.js':''}";
import type { ${entityTypeName}, ${entityCreateTypeName} } from "../../schema/${entityName}/${entityName}Types${jsImport ? '.js':''}";

export const create${entityNameFirstUpper} = async function (db: Surreal, ${entityName}: ${entityCreateTypeName}) {
  const payload = ${entitySchemaName}.parse(${entityName});

  const result = await db.create<${entityCreateTypeName}>("${tableName}", payload);
  
  return result[0]
};
`
}
