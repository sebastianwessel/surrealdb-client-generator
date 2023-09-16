import { tokenize } from './genSchema/tokenize.js'

const result = tokenize(
  `DEFINE FIELD name ON TABLE subscription TYPE string ASSERT $value INSIDE ["create", "read", "write", "delete"];`,
)

console.log(JSON.stringify(result, null, 2))
