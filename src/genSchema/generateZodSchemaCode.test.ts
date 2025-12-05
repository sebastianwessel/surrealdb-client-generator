import { generateZodSchemaCode } from './generateZodSchemaCode.js'
import { type FieldDetail, getDetailsFromDefinition } from './getDetailsFromDefinition.js'

describe('generateZodSchemaCode', () => {
	describe('basic schema', () => {
		it('returns schema for simple object', () => {
			const definition = `
                DEFINE FIELD reviews ON TABLE product TYPE array<string>;
                DEFINE FIELD user ON TABLE product TYPE record<user>;
                DEFINE FIELD rating ON TABLE product TYPE number;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    reviews: z.array(z.string()),
                    user: recordId('user'),
                    rating: z.number()
                })
            `)
		})
	})

	describe('Backticked and special field name handling', () => {
		it('strips backticks from simple field names', () => {
			const fields: FieldDetail[] = [
				{ name: '`type`', table: 'test', zodString: 'z.string()', skip: false },
				{ name: '`value`', table: 'test', zodString: 'z.number()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    type: z.string(),
                    value: z.number()
                })
            `)
		})

		it('strips backticks and quotes field names containing hyphens', () => {
			const fields: FieldDetail[] = [
				{ name: '`max-value`', table: 'test', zodString: 'z.number()', skip: false },
				{ name: '`field-with-hyphen`', table: 'test', zodString: 'z.string()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    "max-value": z.number(),
                    "field-with-hyphen": z.string()
                })
            `)
		})

		it('strips backticks from field names that are JavaScript reserved words and quotes them', () => {
			const fields: FieldDetail[] = [
				{ name: '`default`', table: 'test', zodString: 'z.string()', skip: false },
				{ name: '`const`', table: 'test', zodString: 'z.number()', skip: false },
			]
			const result = generateZodSchemaCode(fields, 'testSchema')
			// Assuming your sanitizeJSKey or equivalent quotes reserved words
			expect(result).toEqualIgnoringWhitespace(`
                const testSchema = z.object({
                    default: z.string(),
                    const: z.number()
                })
            `)
		})
	})

	describe('object schema', () => {
		it('returns schema for simple object', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string()
                    })
                })
            `)
		})

		it('returns schema for optional object', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE option<object>;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string()
                    }).optional()
                })
            `)
		})

		it('returns schema for optional object derived from all values being optional', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE option<number>;
                DEFINE FIELD review.comment ON TABLE product TYPE option<string>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number().optional(),
                        comment: z.string().optional()
                    }).optional()
                })
            `)
		})

		it('returns schema for object with nested array', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.related ON TABLE product TYPE array<object>;
                DEFINE FIELD review.related[*].name ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].rating ON TABLE product TYPE number;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        related: z.object({
                            name: z.string(),
                            rating: z.number()
                        }).array()
                    })
                })
            `)
		})

		it('returns schema for complex object', () => {
			const definition = `
                DEFINE FIELD name ON TABLE product TYPE string;
                DEFINE FIELD price ON TABLE product TYPE number;
                DEFINE FIELD published_at ON TABLE product TYPE datetime;
                DEFINE FIELD is_published ON TABLE product TYPE bool;
                DEFINE FIELD related_authors ON TABLE product TYPE option<array<record<author>>>;
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
                DEFINE FIELD review.author ON TABLE product TYPE object;
                DEFINE FIELD review.author.name ON TABLE product TYPE string;
                DEFINE FIELD review.author.email ON TABLE product TYPE string;
                DEFINE FIELD review.author.tags ON TABLE product TYPE array<string>;
                DEFINE FIELD review.author.user ON TABLE product TYPE record<user>;
                DEFINE FIELD review.related ON TABLE product TYPE array<object>;
                DEFINE FIELD review.related[*].name ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].rating ON TABLE product TYPE number;
                DEFINE FIELD review.related[*].book ON TABLE product TYPE record<book>;
                DEFINE FIELD review.related[*].meta ON TABLE product type object;
                DEFINE FIELD review.related[*].meta.rating ON TABLE product TYPE number;
                DEFINE FIELD review.related[*].meta.comment ON TABLE product TYPE string;
                DEFINE FIELD review.related[*].meta.tags ON TABLE product TYPE array<string>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    name: z.string(),
                    price: z.number(),
                    published_at: z.string().datetime(),
                    is_published: z.boolean(),
                    related_authors: recordId('author').array().optional(),
                    review: z.object({
                        rating: z.number(),
                        comment: z.string(),
                        author: z.object({
                            name: z.string(),
                            email: z.string(),
                            tags: z.array(z.string()),
                            user: recordId('user')
                        }),
                        related: z.object({
                            name: z.string(),
                            rating: z.number(),
                            book: recordId('book'),
                            meta: z.object({
                                rating: z.number(),
                                comment: z.string(),
                                tags: z.array(z.string())
                            })
                        }).array()
                    })
                })
            `)
		})

		it('returns schema for complex object with duplicate field with asterisk syntax', () => {
			const definition = `
                DEFINE FIELD review ON TABLE product TYPE object;
                DEFINE FIELD review.rating ON TABLE product TYPE number;
                DEFINE FIELD review.comment ON TABLE product TYPE string;
                DEFINE FIELD review.author ON TABLE product TYPE object;
                DEFINE FIELD review.author.name ON TABLE product TYPE string;
                DEFINE FIELD review.author.email ON TABLE product TYPE string;
                DEFINE FIELD review.author.tags ON TABLE product TYPE array<string>;
                DEFINE FIELD review.author.tags[*] ON TABLE product TYPE string;
                DEFINE FIELD review.author.user ON TABLE product TYPE record<user>;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toEqualIgnoringWhitespace(`
                const schema = z.object({
                    review: z.object({
                        rating: z.number(),
                        comment: z.string(),
                        author: z.object({
                            name: z.string(),
                            email: z.string(),
                            tags: z.array(z.string()),
                            user: recordId('user')
                        })
                    })
                })
            `)
		})

		it('should skip standalone [*] fields that result in empty names', () => {
			const definition = `
                DEFINE FIELD permissions ON TABLE role TYPE array<object>;
                DEFINE FIELD permissions[*] ON TABLE role TYPE object;
                DEFINE FIELD permissions[*].id ON TABLE role TYPE string;
                DEFINE FIELD [*] ON TABLE role TYPE array DEFAULT [];
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'schema')

			expect(generatedSchema).toContain('permissions: z.object({')
			expect(generatedSchema).toContain('id: z.string()')
			expect(generatedSchema).not.toContain(': z.array(z.unknown())')
		})

		// Bug 1: Empty field name from nested array field definitions using dot-star syntax
		it('should skip dot-star array element definitions (permissions.*)', () => {
			const definition = `
                DEFINE FIELD permissions ON TABLE role TYPE array DEFAULT [];
                DEFINE FIELD permissions.* ON TABLE role TYPE object;
                DEFINE FIELD permissions.*.id ON TABLE role TYPE record<permission>;
                DEFINE FIELD permissions.*.is_deny ON TABLE role TYPE bool DEFAULT false;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, true))
			const generatedSchema = generateZodSchemaCode(fields, 'roleInputSchema')

			// Should NOT have empty field name
			expect(generatedSchema).not.toMatch(/^\s*:\s*z\./)
			expect(generatedSchema).not.toContain(': z.array(z.unknown())')
			// Should have permissions as an array
			expect(generatedSchema).toContain('permissions:')
		})

		it('should handle mixed bracket and dot-star array syntax', () => {
			const definition = `
                DEFINE FIELD items ON TABLE test TYPE array DEFAULT [];
                DEFINE FIELD items.* ON TABLE test TYPE object;
                DEFINE FIELD items.*.name ON TABLE test TYPE string;
                DEFINE FIELD tags ON TABLE test TYPE array<string>;
                DEFINE FIELD tags[*] ON TABLE test TYPE string;
            `
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'testSchema')

			// Should have both items and tags without empty field names
			expect(generatedSchema).toContain('items:')
			expect(generatedSchema).toContain('tags:')
			expect(generatedSchema).not.toMatch(/^\s*:\s*z\./)
		})

		it('should handle backtick-wrapped field names with dot-star syntax', () => {
			const fields: FieldDetail[] = [
				{ name: '`field-items`', table: 'test', zodString: 'z.array(z.unknown())', skip: false },
				{ name: '`field-items`.*', table: 'test', zodString: 'z.object({})', skip: false },
				{ name: '`field-items`.*.name', table: 'test', zodString: 'z.string()', skip: false },
			]
			const generatedSchema = generateZodSchemaCode(fields, 'testSchema')

			// Should NOT have empty field name from `field-items`.*
			expect(generatedSchema).not.toMatch(/^\s*:\s*z\./)
			expect(generatedSchema).toContain('"field-items":')
		})

		it('should handle backtick-wrapped field names with bracket syntax', () => {
			const fields: FieldDetail[] = [
				{ name: '`special-tags`', table: 'test', zodString: 'z.array(z.string())', skip: false },
				{ name: '`special-tags`[*]', table: 'test', zodString: 'z.string()', skip: false },
			]
			const generatedSchema = generateZodSchemaCode(fields, 'testSchema')

			// Should NOT have empty field name from `special-tags`[*]
			expect(generatedSchema).not.toMatch(/^\s*:\s*z\./)
			expect(generatedSchema).toContain('"special-tags":')
		})

		it('should handle deeply nested dot-star array syntax', () => {
			const definition = `
				DEFINE FIELD data ON TABLE test TYPE object;
				DEFINE FIELD data.items ON TABLE test TYPE array;
				DEFINE FIELD data.items.* ON TABLE test TYPE object;
				DEFINE FIELD data.items.*.values ON TABLE test TYPE array;
				DEFINE FIELD data.items.*.values.* ON TABLE test TYPE object;
				DEFINE FIELD data.items.*.values.*.name ON TABLE test TYPE string;
			`
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))
			const generatedSchema = generateZodSchemaCode(fields, 'testSchema')

			// Should NOT have empty field names
			expect(generatedSchema).not.toMatch(/^\s*:\s*z\./)
			expect(generatedSchema).not.toContain(': z.array(z.unknown())')
			// Should have proper nested structure
			expect(generatedSchema).toContain('data:')
			expect(generatedSchema).toContain('items:')
			expect(generatedSchema).toContain('values:')
			expect(generatedSchema).toContain('name:')
		})
	})
})
