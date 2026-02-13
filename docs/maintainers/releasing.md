# Releasing

Use the manual GitHub Actions workflow:

- `.github/workflows/release-manual.yml`
- trigger: `workflow_dispatch`
- branch: `main`

## Required setup

1. Configure npm Trusted Publisher for:
   - package: `@sebastianwessel/surql-gen`
   - repo: `sebastianwessel/surrealdb-client-generator`
   - workflow: `.github/workflows/release-manual.yml`
2. Optional: add `JSR_TOKEN` secret for JSR publish step.

Reference: [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)

## What the workflow guarantees

1. Runs lint, tests, build.
2. Requires explicit docs confirmation (`confirm_docs_updated=true`).
3. Bumps package version and creates git tag via `npm version`.
4. Pushes version commit + tag.
5. Publishes to npm via Trusted Publishing.
6. Optionally publishes to JSR.
7. Creates a GitHub Release for the tag.
