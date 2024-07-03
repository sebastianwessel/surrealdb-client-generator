import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

interface CustomMatchers<R = unknown> {
	toEqualIgnoringWhitespace(expected: string): R
}

declare module 'vitest' {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
