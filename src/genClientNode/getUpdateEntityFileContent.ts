import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getUpdateEntityFileContent = (lib: string, entityName: string) => {
  const entitySchemaName = `${entityName}Schema`
  const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`

  return `
import type { Surreal } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityNameFirstUpper} } from "../../schema/${entityName}/${entityName}Types.js";
import type { PropType } from '../../PropType.ts'

export const update${entityNameFirstUpper} = async function (db: Surreal, id: PropType<${entityNameFirstUpper}, "id"> ,${entityName}: Partial<${entityNameFirstUpper}>) {
  const key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const payload = ${entitySchemaName}.omit({ id: true }).partial().parse(${entityName});

  const result = await db.query("UPDATE ONLY " + key.id + " MERGE $payload ", { payload });

  return result[0] as ${entityNameFirstUpper};
};
`
}
