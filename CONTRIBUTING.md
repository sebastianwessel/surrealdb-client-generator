# Contributing

Thanks for contributing to `@sebastianwessel/surql-gen`.

## Development setup

1. Use the Node.js version from `.nvmrc`.
2. Install dependencies:

```bash
npm ci
```

3. Run quality checks:

```bash
npm run lint
npm test
npm run build
```

## Project structure

- `src/index.ts`: CLI entry point
- `src/database/`: database connection and metadata retrieval
- `src/genSchema/`: SurrealQL -> Zod schema generation
- `src/genClient/`: generated client file templates
- `src/schema/`: schema source loading utilities (file and directory modes)

## Pull request expectations

1. Add or update tests for behavioral changes.
2. Keep README/docs aligned with user-facing changes.
3. Ensure lint, tests, and build pass.
4. Keep commits focused and descriptive.

## Release process

- Maintainers use the manual workflow in `.github/workflows/release-manual.yml`.
- See `docs/maintainers/releasing.md` for details.
