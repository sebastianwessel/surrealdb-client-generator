import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/index.ts'],
	platform: 'node',
	packages: 'external',
	bundle: true,
	outfile: 'dist/index.js',
})
