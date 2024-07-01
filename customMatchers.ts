import { expect } from 'vitest'

function compressWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ').trim()
}

expect.extend({
    toEqualIgnoringWhitespace(received: string, expected: string) {
        const receivedCompressed = compressWhitespace(received)
        const expectedCompressed = compressWhitespace(expected)

        const pass = receivedCompressed === expectedCompressed

        if (pass) {
            return {
                message: () =>
                    `Expected:\n${this.utils.printExpected(expected)}\n` +
                    `Received:\n${this.utils.printReceived(received)}\n` +
                    `(After compressing whitespace)\n` +
                    `Expected: ${this.utils.printExpected(expectedCompressed)}\n` +
                    `Received: ${this.utils.printReceived(receivedCompressed)}`,
                pass: true,
            }
        } else {
            return {
                message: () =>
                    `Expected:\n${this.utils.printExpected(expected)}\n` +
                    `Received:\n${this.utils.printReceived(received)}\n` +
                    `(After compressing whitespace)\n` +
                    `Expected: ${this.utils.printExpected(expectedCompressed)}\n` +
                    `Received: ${this.utils.printReceived(receivedCompressed)}`,
                pass: false,
            }
        }
    },
})