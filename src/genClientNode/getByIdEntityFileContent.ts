import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getByIdEntityFileContent = (lib: string, entityName: string) => {
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`
	const entitySchemaName = `${entityName}Schema`

	return `
import type { Surreal } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";
import type { PropType } from '../../PropType.ts'

export const get${entityNameFirstUpper}ById = async function (db: Surreal, id: PropType<${entityNameFirstUpper}, "id">) {
  const key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const result = await db.query("SELECT * FROM ONLY " + key.id, {});

  return result[0] ? result[0] as ${entityTypeName} : undefined;
};
`
}
