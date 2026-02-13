# Releasing

Use the manual GitHub Actions workflow:

- `.github/workflows/release-manual.yml`
- trigger: `workflow_dispatch`
- branch: `main`
- version source: committed `package.json` and `jsr.json` (must match)

## Required setup

1. Configure npm Trusted Publisher for:
   - package: `@sebastianwessel/surql-gen`
   - repo: `sebastianwessel/surrealdb-client-generator`
   - workflow: `.github/workflows/release-manual.yml`
2. Configure JSR publish from GitHub Actions for this repository (OIDC / GitHub linkage in JSR settings).

References:
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
- [JSR publishing from GitHub Actions](https://jsr.io/docs/publishing-packages#publishing-from-github-actions)

Important:
- For npm Trusted Publishing, do not rely on `NPM_TOKEN` / `NODE_AUTH_TOKEN` in the release workflow.
- The workflow publishes with `--provenance` using GitHub OIDC (`id-token: write`).

## What the workflow guarantees

1. Runs lint, tests, build.
2. Requires explicit docs confirmation (`confirm_docs_updated=true`).
3. Fails if `package.json` and `jsr.json` versions are not in sync.
4. Publishes to npm via Trusted Publishing.
5. Optionally publishes to JSR via GitHub Actions OIDC.
6. Creates and pushes git tag `v<version>`.
7. Creates a GitHub Release for that tag.
