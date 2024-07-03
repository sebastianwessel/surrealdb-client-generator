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
					`Expected:\n${this.utils.printExpected(expected)}\nReceived:\n${this.utils.printReceived(received)}\n(After compressing whitespace)\nExpected: ${this.utils.printExpected(expectedCompressed)}\nReceived: ${this.utils.printReceived(receivedCompressed)}`,
				pass: true,
			}
		}
		return {
			message: () =>
				`Expected:\n${this.utils.printExpected(expected)}\nReceived:\n${this.utils.printReceived(received)}\n(After compressing whitespace)\nExpected: ${this.utils.printExpected(expectedCompressed)}\nReceived: ${this.utils.printReceived(receivedCompressed)}`,
			pass: false,
		}
	},
})
