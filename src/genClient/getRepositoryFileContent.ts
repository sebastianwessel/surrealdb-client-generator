export const getRepositoryContent = (lib: string, entityName: string, jsImport = true) => {
	return `
import type { Surreal } from "${lib}"

import { create${entityName} } from "./create${entityName}${jsImport ? '.js':''}"
import { getAll${entityName}s } from "./getAll${entityName}s${jsImport ? '.js':''}"
import { get${entityName}ById } from "./get${entityName}ById${jsImport ? '.js':''}"
import { update${entityName} } from "./update${entityName}${jsImport ? '.js':''}"
import { delete${entityName} } from "./delete${entityName}${jsImport ? '.js':''}"

export const get${entityName}Repository = (db: Surreal) => {
  return {
    create${entityName}: create${entityName}.bind(undefined, db),
    getAll${entityName}s: getAll${entityName}s.bind(undefined, db),
    get${entityName}ById: get${entityName}ById.bind(undefined, db),
    update${entityName}: update${entityName}.bind(undefined, db),
    delete${entityName}: delete${entityName}.bind(undefined, db),
  }
}
`
}
