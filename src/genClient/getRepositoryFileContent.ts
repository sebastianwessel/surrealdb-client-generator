export const getRepositoryContent = (lib: string, entityName: string) => {
	return `
import type { Surreal } from "${lib}"

import { create${entityName} } from "./create${entityName}"
import { getAll${entityName}s } from "./getAll${entityName}s"
import { get${entityName}ById } from "./get${entityName}ById"
import { update${entityName} } from "./update${entityName}"
import { delete${entityName} } from "./delete${entityName}"

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
