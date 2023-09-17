export const getRepositoryContent = (entityName: string) => {
  return `
import type { Surreal } from "surrealdb.js"

import { create${entityName} } from "./create${entityName}.js"
import { getAll${entityName}s } from "./getAll${entityName}s.js"
import { get${entityName}ById } from "./get${entityName}ById.js"
import { update${entityName} } from "./update${entityName}.js"
import { delete${entityName} } from "./delete${entityName}.js"

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
