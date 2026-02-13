# Getting Started

## Install

Run directly:

```bash
npx surql-gen
```

Or install as a dev dependency:

```bash
npm i -D @sebastianwessel/surql-gen
```

## Basic usage

Generate from a running SurrealDB instance:

```bash
surql-gen --surreal http://localhost:8000 --username root --password root --ns test --db test
```

Generate from schema definitions:

```bash
surql-gen -f ./schema.surql
```

Generate from a schema directory:

```bash
surql-gen -f ./db/schema
```

## Output

By default, output is written to `client_generated`:

- `_generated/`: regenerated each run
- `schema/`: extension points for custom application code
