import 'vitest'

interface CustomMatchers<R = unknown> {
	toEqualIgnoringWhitespace(expected: string): R
}

declare module 'vitest' {
	// biome-ignore lint/suspicious/noExplicitAny: ok here
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
