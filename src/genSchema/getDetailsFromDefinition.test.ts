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

		it('mark fields with value <future> as skipped', () => {
			const result = getDetailsFromDefinition(
				`DEFINE FIELD price.amount ON TABLE product TYPE number;
  VALUE <future> {
    LET $lowest_vendor = (SELECT vendors[WHERE price.amount = math::min(vendors.*.price.amount)][0] FROM this);
    $lowest_vendor.price.amount;
  };`,
				isInputSchema,
			)

			expect(result.skip).toBeTruthy()
		})

		it('adds passthrough to the schema if FLEXIBLE is set', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD metadata ON TABLE user FLEXIBLE TYPE object', isInputSchema)

			expect(result.zodString).toBe('z.object({}).passthrough()')
		})

		it('returns a array schema with item type unknown', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD list ON TABLE product TYPE array;', isInputSchema)

			expect(result.zodString).toBe('z.array(z.unknown())')
		})

		it('returns a array schema with item type array<string>', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD list ON TABLE product TYPE array<string>;', isInputSchema)

			expect(result.zodString).toBe('z.array(z.string())')
		})

		it('generates a enum schema for string', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE string ASSERT INSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)

			expect(result.zodString).toBe("z.enum(['create', 'read', 'write', 'delete'])")
		})

		it('generates a enum schema for array<string>', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE array<string> ASSERT ALLINSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)
			const expected = `z.array(z.enum(['create', 'read', 'write', 'delete'])).refine(
					(arr) => arr.every((item) => ['create', 'read', 'write', 'delete'].includes(item)),
					{ message: "Array items must be one of ['create', 'read', 'write', 'delete']" }
			)`
			expect(result.zodString).toEqualIgnoringWhitespace(expected)
		})

		it('generates a enum schema for array', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE array ASSERT ALLINSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)
			const expected = `z.array(z.enum(['create', 'read', 'write', 'delete'])).refine(
					(arr) => arr.every((item) => ['create', 'read', 'write', 'delete'].includes(item)),
					{ message: "Array items must be one of ['create', 'read', 'write', 'delete']" }
			)`
			expect(result.zodString).toEqualIgnoringWhitespace(expected)
		})
	})

	describe('Union string literal types (enum-like)', () => {
		const isInputSchema = true // Default for most of these, can be overridden

		it('returns z.enum for basic union string literal type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" | "archived";',
				false, // isInputSchema = false for this output schema test
			)
			expect(result.name).toBe('status')
			expect(result.type).toBe('"published" | "draft" | "archived"')
			expect(result.zodString).toBe("z.enum(['published', 'draft', 'archived'])")
		})

		it('returns optional z.enum for option<union string literal type>', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft">;',
				false, // isInputSchema = false
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns optional z.enum for input schema with option<union string literal type>', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft">;',
				true, // isInputSchema = true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns optional z.enum for input schema when union string literal type has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" DEFAULT "draft";',
				isInputSchema, // true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns required z.enum for output schema when union string literal type has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" DEFAULT "draft";',
				false, // isInputSchema
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft'])")
		})

		it('returns optional z.enum for input schema when option<union string literal type> has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft"> DEFAULT "draft";',
				isInputSchema, // true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns required z.enum for output schema when option<union string literal type> has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft"> DEFAULT "draft";',
				false, // isInputSchema
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft'])")
		})

		it('handles string literals with spaces', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD role ON user TYPE "project admin" | "content editor";',
				false,
			)
			expect(result.zodString).toBe("z.enum(['project admin', 'content editor'])")
		})

		it('handles string literals with escaped quotes', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD message ON log TYPE "value with \\"quotes\\"" | "another value";',
				false,
			)
			expect(result.zodString).toBe("z.enum(['value with \"quotes\"', 'another value'])")
		})

		it('handles string literals with other special characters if tokenizer passes them through', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD category ON item TYPE "tools/hardware" | "apparel";', false)
			expect(result.zodString).toBe("z.enum(['tools/hardware', 'apparel'])")
		})

		it('should not conflict with regular string type if not a union literal', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD name ON "user" TYPE string;', false)
			expect(result.zodString).toBe('z.string()')
		})

		it('should handle option<string> correctly and not misinterpret as enum', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON "product" TYPE option<string>;', false)
			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns z.enum for basic union string literal type with single quotes', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD status ON post TYPE 'published' | 'draft' | 'archived';",
				false,
			)
			expect(result.name).toBe('status')
			expect(result.type).toBe("'published' | 'draft' | 'archived'")
			expect(result.zodString).toBe("z.enum(['published', 'draft', 'archived'])")
		})

		it('returns optional z.enum for option<union string literal type with single quotes>', () => {
			const result = getDetailsFromDefinition("DEFINE FIELD status ON post TYPE option<'published' | 'draft'>;", false)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('handles single-quoted string literals with escaped single quotes', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD message ON log TYPE 'value with \\'quotes\\'' | 'another value';",
				false,
			)
			expect(result.zodString).toBe("z.enum(['value with \\'quotes\\'', 'another value'])")
		})

		it('handles mixed quotes if the tokenizer allows (though SurrealDB likely expects consistency per literal)', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD mixed ON test TYPE "double_quoted" | \'single_quoted\';',
				false,
			)
			expect(result.zodString).toBe("z.enum(['double_quoted', 'single_quoted'])")
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

		it('returns a record with defined type', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD record ON TABLE product TYPE record<test>;', isInputSchema)

			expect(result.zodString).toBe(`recordId('test')`)
		})

		it('returns an array of records with defined type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE array<record<test>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe(`recordId('test').array()`)
		})

		it('returns an array of records without defined types', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD record ON TABLE product TYPE array<record>;', isInputSchema)

			expect(result.zodString).toBe('recordId().array()')
		})

		it('returns an optional array of records with defined type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE option<array<record<test>>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe(`recordId('test').array().optional()`)
		})

		it('returns an optional array of records without defined types', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE option<array<record>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('recordId().array().optional()')
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

		it('does not mark fields with value <future> as skipped', () => {
			const result = getDetailsFromDefinition(
				`DEFINE FIELD price.amount ON TABLE product TYPE number;
  VALUE <future> {
    LET $lowest_vendor = (SELECT vendors[WHERE price.amount = math::min(vendors.*.price.amount)][0] FROM this);
    $lowest_vendor.price.amount;
  };`,
				isInputSchema,
			)

			expect(result.zodString).toBe('z.number()')
			expect(result.skip).toBeFalsy()
		})

		it('adds passthrough to the schema if FLEXIBLE is set', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD metadata ON TABLE user FLEXIBLE TYPE object', isInputSchema)

			expect(result.zodString).toBe('z.object({}).passthrough()')
		})
	})
})
