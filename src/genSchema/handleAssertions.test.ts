import { handleAssertions } from './handleAssertions.js'

describe('handleAssertions', () => {
	describe('String assertions', () => {
		it('handles string::is:: assertions', () => {
			expect(handleAssertions('z.string()', 'string::is::email()', 'string')).toBe('z.string().email()')
			expect(handleAssertions('z.string()', 'string::is::url()', 'string')).toBe('z.string().url()')
			expect(handleAssertions('z.string()', 'string::is::uuid()', 'string')).toBe('z.string().uuid()')
			expect(handleAssertions('z.string()', 'string::is::ip()', 'string')).toBe('z.string().ip()')
			expect(handleAssertions('z.string()', 'string::is::ipv4()', 'string')).toBe('z.string().ip({ version: "v4" })')
			expect(handleAssertions('z.string()', 'string::is::ipv6()', 'string')).toBe('z.string().ip({ version: "v6" })')
			expect(handleAssertions('z.string()', 'string::is::datetime()', 'string')).toBe('z.string().datetime()')
		})

		it('handles regex-based string::is:: assertions', () => {
			expect(handleAssertions('z.string()', 'string::is::alphanum()', 'string')).toBe(
				'z.string().regex(/^[a-zA-Z0-9]*$/)',
			)
			expect(handleAssertions('z.string()', 'string::is::alpha()', 'string')).toBe('z.string().regex(/^[a-zA-Z]*$/)')
			expect(handleAssertions('z.string()', 'string::is::ascii()', 'string')).toBe('z.string().regex(/^[\x00-\x7F]*$/)')
			expect(handleAssertions('z.string()', 'string::is::hexadecimal()', 'string')).toBe(
				'z.string().regex(/^[0-9a-fA-F]*$/)',
			)
			expect(handleAssertions('z.string()', 'string::is::latitude()', 'string')).toBe(
				'z.string().regex(/^(+|-)?(?:90(?:(?:.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:.[0-9]{1,6})?))$/)',
			)
			expect(handleAssertions('z.string()', 'string::is::longitude()', 'string')).toBe(
				'z.string().regex(/^(+|-)?(?:180(?:(?:.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:.[0-9]{1,6})?))$/)',
			)
			expect(handleAssertions('z.string()', 'string::is::numeric()', 'string')).toBe('z.string().regex(/^[0-9]*$/)')
			expect(handleAssertions('z.string()', 'string::is::semver()', 'string')).toBe(
				'z.string().regex(/^(0|[1-9][0-9]*).(0|[1-9][0-9]*).(0|[1-9][0-9]*)(-(0|[1-9A-Za-z-][0-9A-Za-z-]*)(.[0-9A-Za-z-]+)*)?(+[0-9A-Za-z-]+(.[0-9A-Za-z-]+)*)?$/)',
			)
		})

		it('handles string length comparisons', () => {
			expect(handleAssertions('z.string()', 'string::len($value) > 5', 'string')).toBe('z.string().min(6)')
			expect(handleAssertions('z.string()', 'string::len($value) >= 5', 'string')).toBe('z.string().min(5)')
			expect(handleAssertions('z.string()', 'string::len($value) < 10', 'string')).toBe('z.string().max(9)')
			expect(handleAssertions('z.string()', 'string::len($value) <= 10', 'string')).toBe('z.string().max(10)')
			expect(handleAssertions('z.string()', 'string::len($value) = 8', 'string')).toBe('z.string().length(8)')
		})

		it('handles IN and INSIDE assertions', () => {
			expect(handleAssertions('z.string()', "IN ['a', 'b', 'c']", 'string')).toBe("z.enum(['a', 'b', 'c'])")
			expect(handleAssertions('z.string()', "INSIDE ['x', 'y', 'z']", 'string')).toBe("z.enum(['x', 'y', 'z'])")
		})

		it('handles NOT IN and NOTINSIDE assertions', () => {
			const expected = `
                z.string().refine((val) => !['a', 'b', 'c'].includes(val), {
                    message: "String must not be one of ['a', 'b', 'c']",
                })
            `
			expect(handleAssertions('z.string()', "NOT IN ['a', 'b', 'c']", 'string')).toEqualIgnoringWhitespace(expected)
			expect(handleAssertions('z.string()', "NOTINSIDE ['a', 'b', 'c']", 'string')).toEqualIgnoringWhitespace(expected)
		})

		it('handles word count assertions', () => {
			const multiWordAssert = `
                z.string().refine((val) => val.trim().split(/\\s+/).length > 1, {
                    message: "String must contain more than 1 word",
                })
            `
			expect(
				handleAssertions('z.string()', 'array::len(string::words($value)) > 1', 'string'),
			).toEqualIgnoringWhitespace(multiWordAssert)
		})

		it('handles conditional word count assertions', () => {
			const conditionalAssert = `
                z.string().refine((val) => !val || val.trim().split(/\\s+/).length > 1, {
                    message: "String must be empty or contain more than 1 word",
                })
            `
			expect(
				handleAssertions('z.string()', 'IF $value THEN array::len(string::words($value)) > 1 ELSE true END', 'string'),
			).toEqualIgnoringWhitespace(conditionalAssert)
		})

		it('handles unknown string::is:: assertion', () => {
			expect(handleAssertions('z.string()', 'string::is::unknown()', 'string')).toBe('z.string()')
		})

		describe('Number assertions', () => {
			it('handles comparison assertions', () => {
				expect(handleAssertions('z.number()', '> 0', 'number')).toBe('z.number().min(1)')
				expect(handleAssertions('z.number()', '<= 100', 'number')).toBe('z.number().max(100)')
				expect(handleAssertions('z.number()', '= 50', 'number')).toBe('z.literal(50)')
				expect(handleAssertions('z.number()', '== 90', 'number')).toBe('z.literal(90)')
			})
		})

		describe('Date assertions', () => {
			it('handles empty assertion', () => {
				expect(handleAssertions('z.date()', '', 'date')).toEqualIgnoringWhitespace('z.date()')
			})
			it('handles any assertion', () => {
				expect(handleAssertions('z.date()', '> time::now() + 30d', 'date')).toEqualIgnoringWhitespace('z.date()')
			})
		})

		describe('Array assertions', () => {
			it('handles array length assertions', () => {
				const lengthAssert = `z.array(z.unknown()).refine(
                    (arr) => arr.length > 0,
                    { message: "Array length must be > 0" }
                )`
				expect(handleAssertions('z.array(z.unknown())', 'array::len($value) > 0', 'array')).toEqualIgnoringWhitespace(
					lengthAssert,
				)
			})

			it('handles ALLINSIDE assertions', () => {
				const allInsideAssert = `z.array(z.enum(['a', 'b', 'c'])).refine(
                    (arr) => arr.every((item) => ['a', 'b', 'c'].includes(item)),
                    { message: "Array items must be one of ['a', 'b', 'c']" }
                )`
				expect(
					handleAssertions('z.array(z.unknown())', "ALLINSIDE ['a', 'b', 'c']", 'array'),
				).toEqualIgnoringWhitespace(allInsideAssert)
			})

			it('throws error for invalid ALLINSIDE assertions', () => {
				expect(() => handleAssertions('z.array(z.unknown())', 'ALLINSIDE', 'array')).toThrow(
					'Invalid ALLINSIDE assertion',
				)
			})
		})

		describe('Multiple assertions', () => {
			it('handles multiple assertions combined with AND', () => {
				const multipleAssert = 'z.string().min(1).email()'
				expect(handleAssertions('z.string()', 'string::len($value) > 0 AND string::is::email()', 'string')).toBe(
					multipleAssert,
				)
			})
		})

		describe('Edge cases', () => {
			it('returns original schema for empty assertion', () => {
				expect(handleAssertions('z.string()', '', 'string')).toBe('z.string()')
			})

			it('handles unknown schema types', () => {
				// biome-ignore lint/suspicious/noExplicitAny: ok here
				expect(handleAssertions('z.unknown()', 'some assertion', 'unknown' as any)).toBe('z.unknown()')
			})

			it('handles unkown assertion', () => {
				expect(handleAssertions('z.string()', 'unknown', 'string')).toBe('z.string()')
			})
		})
	})
})
