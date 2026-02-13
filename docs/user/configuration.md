# Configuration

Configuration can be provided via CLI flags, config file, or both.
When both are present, CLI values override config file values.

## Example config

```json
{
  "schemaFile": "./schema",
  "surreal": "http://localhost:8000",
  "username": "root",
  "password": "root",
  "ns": "test",
  "db": "test",
  "outputFolder": "./client_generated",
  "generateClient": true,
  "surrealImage": "surrealdb/surrealdb:latest"
}
```

## Important options

- `schemaFile`: file or directory containing `.surql` / `.surrealql` files
- `surreal`: SurrealDB endpoint
- `ns`, `db`, `username`, `password`: auth and database selection
- `outputFolder`: generated output root
- `generateClient`: toggle generated client code
- `surrealImage`: container image used for temporary schema-file mode database

## Zod compatibility note

- Zod v4 dropped `z.string().ip()` ([changelog](https://zod.dev/v4/changelog)).
- To keep generated code compatible with both Zod 3 and Zod 4, IP assertions are emitted as `refine` validators instead of `string().ip()`.
- A future Zod 4-only mode could switch to native `ipv4/ipv6` schemas.
