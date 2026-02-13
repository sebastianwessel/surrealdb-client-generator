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
