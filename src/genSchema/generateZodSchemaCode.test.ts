import { generateZodSchemaCode } from './generateZodSchemaCode.js'
import { getDetailsFromDefinition } from './getDetailsFromDefinition.js'

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
                            tags: z.string().array(),
                            user: recordId('user')
                        })
                    })
                })
            `)
		})
	})
})
