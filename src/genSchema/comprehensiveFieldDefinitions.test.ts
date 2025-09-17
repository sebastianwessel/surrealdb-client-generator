import { describe, expect, it } from 'vitest'
import { getDetailsFromDefinition } from './getDetailsFromDefinition.js'
import { generateZodSchemaCode } from './generateZodSchemaCode.js'

describe('Comprehensive Field Definition Tests', () => {
	describe('Array with defaults', () => {
		it('should handle array with empty array default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD tags ON TABLE post TYPE array<string> DEFAULT [];',
				true
			)
			expect(result.zodString).toBe('z.array(z.string()).optional()')
			expect(result.default).toBe('[]')
		})

		it('should handle array with default values', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD roles ON TABLE user TYPE array<string> DEFAULT ["user"];',
				true
			)
			expect(result.zodString).toBe('z.array(z.string()).optional()')
			expect(result.default).toBe('["user"]')
		})

		it('should handle optional array with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD tags ON TABLE post TYPE option<array<string>> DEFAULT [];',
				true
			)
			expect(result.zodString).toBe('z.array(z.string()).optional()')
		})

		it('should handle array of objects with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD metadata ON TABLE user TYPE array<object> DEFAULT [];',
				true
			)
			expect(result.zodString).toBe('z.array(z.object({})).optional()')
		})

		it('should handle DEFAULT ALWAYS for arrays', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD tags ON TABLE post TYPE array<object> DEFAULT ALWAYS [];',
				true
			)
			expect(result.zodString).toBe('z.array(z.object({})).optional()')
		})
	})

	describe('Field name sanitization and special characters', () => {
		it('should handle field names with backticks', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD `value` ON TABLE data TYPE any;',
				false
			)
			expect(result.name).toBe('value')
			expect(result.zodString).toBe('z.any()')
		})

		it('should handle field names with special characters', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD `user-id` ON TABLE users TYPE string;',
				false
			)
			expect(result.name).toBe('user-id')
		})

		it('should handle nested fields with backticks', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD `data`.`sub-field` ON TABLE records TYPE string;',
				false
			)
			expect(result.name).toBe('data.sub-field')
		})

		it('should handle reserved keywords as field names', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD `class` ON TABLE items TYPE string;',
				false
			)
			expect(result.name).toBe('class')
		})

		it('should handle field names with spaces', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD `full name` ON TABLE users TYPE string;',
				false
			)
			expect(result.name).toBe('full name')
		})

		it('should generate valid TypeScript property names for special characters', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD `user-id` ON TABLE data TYPE string;', false),
				getDetailsFromDefinition('DEFINE FIELD `full name` ON TABLE data TYPE string;', false),
				getDetailsFromDefinition('DEFINE FIELD `123abc` ON TABLE data TYPE string;', false)
			]
			const schema = generateZodSchemaCode(fields, 'dataSchema')

			expect(schema).toContain('"user-id": z.string()')
			expect(schema).toContain('"full name": z.string()')
			expect(schema).toContain('"123abc": z.string()')
		})
	})

	describe('Complex type definitions', () => {
		it('should handle union types', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD user_id ON TABLE user TYPE uuid | int;',
				false
			)
			expect(result.zodString).toBe('z.union([z.string().uuid(), z.number()])')
		})

		it('should handle literal types', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON TABLE order TYPE "pending" | "processing" | "completed";',
				false
			)
			expect(result.zodString).toBe("z.enum(['pending', 'processing', 'completed'])")
		})

		it('should handle set type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD tags ON TABLE post TYPE set<string>;',
				false
			)
			expect(result.zodString).toBe('z.array(z.string())')
		})

		it('should handle set with size constraint', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD tags ON TABLE post TYPE set<string, 10>;',
				false
			)
			expect(result.zodString).toContain('z.array(z.string())')
		})

		it('should handle decimal type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD price ON TABLE product TYPE decimal;',
				false
			)
			expect(result.zodString).toBe('z.number()')
		})

		it('should handle bytes type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD data ON TABLE files TYPE bytes;',
				false
			)
			expect(result.zodString).toBe('z.instanceof(Uint8Array)')
		})

		it('should handle range type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD age ON TABLE user TYPE range<18..120>;',
				false
			)
			expect(result.zodString).toContain('z.number().min(18).max(120)')
		})
	})

	describe('VALUE clauses and transformations', () => {
		it('should make fields with VALUE optional in input schemas', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD email ON TABLE user TYPE string VALUE string::lowercase($value);',
				true
			)
			expect(result.skip).toBe(false)
			expect(result.zodString).toBe('z.string().optional()')
		})

		it('should handle VALUE with time::now()', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD updated ON TABLE user VALUE time::now();',
				true
			)
			expect(result.skip).toBe(false)
			expect(result.zodString).toBe('z.any().optional()')
		})

		it('should make READONLY VALUE fields optional in input schemas', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD created_at ON TABLE user TYPE datetime READONLY VALUE time::now();',
				true
			)
			expect(result.zodString).toBe('z.string().datetime().optional()')
		})

		it('should handle VALUE with default fallback in input schemas', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD created_by ON TABLE user TYPE record<user> VALUE $before OR type::thing('user', $auth.id);",
				true
			)
			expect(result.zodString).toBe("recordId('user').optional()")
		})
	})

	describe('ASSERT validations', () => {
		it('should handle ASSERT with ALLINSIDE for arrays', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD permissions ON TABLE acl TYPE array<string> ASSERT $value ALLINSIDE ["create", "read", "write", "delete"];',
				false
			)
			expect(result.zodString).toContain('z.array')
			expect(result.zodString).toContain('enum')
		})

		it('should handle ASSERT with custom validation', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD email ON TABLE user TYPE string ASSERT string::is_email($value);',
				false
			)
			expect(result.zodString).toContain('z.string()')
			expect(result.assert).toContain('is_email')
		})

		it('should handle ASSERT with error messages', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD num ON TABLE data TYPE int ASSERT { IF $value % 2 = 0 { RETURN true } ELSE { THROW "Number must be even" } };',
				false
			)
			expect(result.zodString).toBe('z.number()')
		})
	})

	describe('Recipe table production cases', () => {
		it('should make array fields with DEFAULT optional in input schemas', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD images ON recipe TYPE option<array<record<asset>>> DEFAULT [] PERMISSIONS FULL',
				true
			)
			expect(result.zodString).toBe('recordId(\'asset\').array().optional()')
		})

		it('should handle meta.created_at with VALUE clause', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD meta.created_at ON recipe TYPE datetime READONLY VALUE time::now() PERMISSIONS FULL',
				true
			)
			expect(result.zodString).toBe('z.string().datetime().optional()')
		})

		it('should handle fields with both DEFAULT and VALUE clauses', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD meta.created_by ON recipe TYPE option<record<user>> DEFAULT type::thing('user', $auth.id) VALUE $before OR type::thing('user', $auth.id) PERMISSIONS FULL",
				true
			)
			expect(result.zodString).toBe("recordId('user').optional()")
		})

		it('should handle option<array> types correctly', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD required_tiers ON recipe TYPE option<array<record<chef_subscription_tier>>> PERMISSIONS FULL',
				true
			)
			expect(result.zodString).toBe('recordId(\'chef_subscription_tier\').array().optional()')
		})
	})

	describe('Edge cases from production', () => {
		it('should handle nested object with backtick field names', () => {
			const definition = `
				DEFINE FIELD change ON TABLE log TYPE object;
				DEFINE FIELD change.\`value\` ON TABLE log TYPE object;
				DEFINE FIELD change.\`value\`.\`after\` ON TABLE log TYPE any;
				DEFINE FIELD change.\`value\`.\`before\` ON TABLE log TYPE any;
			`
			const fields = definition
				.split(';')
				.filter(x => x.trim().length)
				.map(def => getDetailsFromDefinition(def, false))

			const schema = generateZodSchemaCode(fields, 'logSchema')

			expect(schema).toContain('change:')
			expect(schema).toContain('value:')
			expect(schema).toContain('after:')
			expect(schema).toContain('before:')
		})

		it('should handle arrays with nested defaults', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD settings.notifications ON TABLE user TYPE array<object> DEFAULT [{ email: true, push: false }];',
				true
			)
			expect(result.zodString).toBe('z.array(z.object({})).optional()')
		})

		it('should handle FLEXIBLE fields without explicit type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD metadata ON TABLE user FLEXIBLE;',
				false
			)
			expect(result.zodString).toBe('z.any()')
		})

		it('should handle geometry types', () => {
			const geoTypes = [
				'point', 'line', 'polygon', 'multipoint',
				'multiline', 'multipolygon', 'collection',
				'geometrycollection', 'geometry'
			]

			for (const geoType of geoTypes) {
				const result = getDetailsFromDefinition(
					`DEFINE FIELD location ON TABLE places TYPE ${geoType};`,
					false
				)
				expect(result.zodString).toBe('z.object({}).passthrough()')
			}
		})
	})

	describe('Default value generation in schemas', () => {
		it('should add .default() to schema when DEFAULT is present for output schemas', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD status ON TABLE order TYPE string DEFAULT "pending";', false)
			]
			const schema = generateZodSchemaCode(fields, 'orderSchema')
			expect(schema).toContain('.default("pending")')
		})

		it('should handle numeric default values', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD count ON TABLE stats TYPE number DEFAULT 0;', false)
			]
			const schema = generateZodSchemaCode(fields, 'statsSchema')
			expect(schema).toContain('.default(0)')
		})

		it('should handle boolean default values', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD active ON TABLE user TYPE bool DEFAULT true;', false)
			]
			const schema = generateZodSchemaCode(fields, 'userSchema')
			expect(schema).toContain('.default(true)')
		})

		it('should handle array default values', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD tags ON TABLE post TYPE array<string> DEFAULT [];', false)
			]
			const schema = generateZodSchemaCode(fields, 'postSchema')
			expect(schema).toContain('.default([])')
		})

		it('should handle object default values', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD settings ON TABLE user TYPE object DEFAULT {};', false)
			]
			const schema = generateZodSchemaCode(fields, 'userSchema')
			expect(schema).toContain('.default({})')
		})

		it('should not add default to optional fields', () => {
			const fields = [
				getDetailsFromDefinition('DEFINE FIELD bio ON TABLE user TYPE string DEFAULT "No bio";', true)
			]
			const schema = generateZodSchemaCode(fields, 'userSchema')
			expect(schema).not.toContain('.default(')
			expect(schema).toContain('.optional()')
		})
	})
})