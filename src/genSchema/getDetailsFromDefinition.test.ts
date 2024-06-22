import { getDetailsFromDefinition } from './getDetailsFromDefinition.js'

describe('getDetailsFromDefinition', () => {
	describe('input schema', () => {
		const isInputSchema = true
		it('returns optional string for optional string without default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns optional string for optional string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string> DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns optional string for string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE string DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns required string for string without default', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON TABLE product TYPE string;', isInputSchema)

			expect(result.zodString).toBe('z.string()')
		})
	})

	describe('output schema', () => {
		const isInputSchema = false
		it('returns optional string for optional string without default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns required string for optional string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string> DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string()')
		})

		it('returns required string for string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE string DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string()')
		})

		it('returns required string for string without default', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON TABLE product TYPE string;', isInputSchema)

			expect(result.zodString).toBe('z.string()')
		})
	})
})
