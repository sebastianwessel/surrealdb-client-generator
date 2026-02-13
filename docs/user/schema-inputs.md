# Schema Inputs

`surql-gen` supports two schema input modes:

1. Single schema file
2. Schema directory (recursive)

## Single file

```bash
surql-gen -f ./schema.surql
```

## Directory mode

```bash
surql-gen -f ./db/schema
```

Directory mode behavior:

- scans recursively
- includes only `.surql` and `.surrealql`
- sorts files deterministically before import

## Ignore rules

To exclude files/folders in directory mode, add a `.ignore` file in the schema directory.

Example:

```txt
# ignore snapshots
migrations/**

# ignore one file
legacy.surql
```

Patterns are matched relative to the provided schema directory.
