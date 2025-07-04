import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getUpdateEntityFileContent = (lib: string, entityName: string) => {
	const entitySchemaName = `${entityName}Schema`
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`

	return `
import { type Surreal, RecordId} from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityNameFirstUpper} } from "../../schema/${entityName}/${entityName}Types.js";

export const update${entityNameFirstUpper} = async function (db: Surreal, id: RecordId ,${entityName}: Partial<${entityNameFirstUpper}>) {
  const _key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const payload = ${entitySchemaName}.omit({ id: true }).partial().parse(${entityName});

  return db.merge<${entityNameFirstUpper}>(id, payload);
};
`
}
