/// <reference types="vitest" />

interface CustomMatchers<R = unknown> {
    toEqualIgnoringWhitespace(expected: string): R
}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}