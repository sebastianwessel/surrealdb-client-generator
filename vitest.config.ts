import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['**/*.test.ts'],
		globals: true,
		disableConsoleIntercept: true,
		setupFiles: ['./vitest.customMatchers.ts'],
	},
})
