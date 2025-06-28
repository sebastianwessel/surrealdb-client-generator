import { describe, expect, it } from 'vitest'
import { mergeNested } from './mergeNested'

describe('mergeNested', () => {
	it('correctly processes simple fields', () => {
		const fields: Record<string, string> = {
			title: 'DEFINE FIELD title ON book TYPE string PERMISSIONS FULL',
			published: 'DEFINE FIELD published ON book TYPE datetime PERMISSIONS FULL',
		}

		const result = mergeNested(fields, true, 'book')

		expect(result).toEqualIgnoringWhitespace(`
            const bookInputSchemaGen = z.object({
                title: z.string(),
                published: z.string().datetime()
            })
        `)
	})

	it('correctly processes nested objects and arrays', () => {
		const fields: Record<string, string> = {
			title: 'DEFINE FIELD title ON book TYPE string PERMISSIONS FULL',
			published: 'DEFINE FIELD published ON book TYPE datetime PERMISSIONS FULL',
			vendors: 'DEFINE FIELD vendors ON book TYPE option<array<object>> PERMISSIONS FULL',
			'vendors[*]': 'DEFINE FIELD vendors[*] ON book TYPE object PERMISSIONS FULL',
			'vendors[*].name': 'DEFINE FIELD vendors[*].name ON book TYPE string PERMISSIONS FULL',
			'vendors[*].price': 'DEFINE FIELD vendors[*].price ON book TYPE number PERMISSIONS FULL',
			'vendors[*].ratings': 'DEFINE FIELD vendors[*].ratings ON book TYPE array<object> DEFAULT [] PERMISSIONS FULL',
			'vendors[*].ratings[*]': 'DEFINE FIELD vendors[*].ratings[*] ON book TYPE object PERMISSIONS FULL',
			'vendors[*].ratings[*].score':
				'DEFINE FIELD vendors[*].ratings[*].score ON book TYPE number DEFAULT 0 PERMISSIONS FULL',
		}

		const result = mergeNested(fields, true, 'book')

		expect(result).toEqualIgnoringWhitespace(`
            const bookInputSchemaGen = z.object({
                title: z.string(),
                published: z.string().datetime(),
                vendors: z.object({
                    name: z.string(),
                    price: z.number(),
                    ratings: z.object({
                        score: z.number().optional()
                    }).array().optional()
                }).array().optional()
            })
        `)
	})

	it('correctly handles fields with VALUE <future>', () => {
		const fields: Record<string, string> = {
			test: 'DEFINE FIELD test ON book TYPE string PERMISSIONS FULL',
			skipped: 'DEFINE FIELD skipped ON book TYPE number VALUE <future> { 1 + 1 } PERMISSIONS FULL',
			yo: 'DEFINE FIELD yo ON book TYPE number PERMISSIONS FULL',
		}

		const result = mergeNested(fields, true, 'book')

		expect(result).toContain('const bookInputSchemaGen = z.object({')
		expect(result).toContain('test: z.string()')
		expect(result).not.toContain('skipped:') // This field should be skipped
		expect(result).toContain('yo: z.number()')
		expect(result).toContain('})')
	})

	it('correctly handles input vs output schema naming', () => {
		const fields: Record<string, string> = {
			test: 'DEFINE FIELD test ON book TYPE string PERMISSIONS FULL',
		}

		const resultInput = mergeNested(fields, true, 'book')
		const resultOutput = mergeNested(fields, false, 'book')

		expect(resultInput).toContain('const bookInputSchemaGen = z.object({')
		expect(resultOutput).toContain('const bookOutputSchemaGen = z.object({')
		expect(resultInput).toContain('test: z.string()')
		expect(resultOutput).toContain('test: z.string()')
	})
})
