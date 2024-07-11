import { generateSchemaForTable } from './generateTableSchema.js'

vi.mock('../database/getTableInfo.js', () => ({
	getTableInfo: vi.fn().mockResolvedValue({
		fields: { name: 'DEFINE FIELD name ON command TYPE string PERMISSIONS FULL' },
	}),
}))

describe('generateTableSchema', () => {
	it('generates a schema for a SCHEMAFULL table', async () => {
		const { inputFields, outputFields } = await generateSchemaForTable(
			'test',
			'DEFINE TABLE test TYPE ANY SCHEMAFULL PERMISSIONS NONE',
		)

		expect(inputFields).toBe('const testInputSchemaGen = z.object({\nname: z.string()\n})')

		expect(outputFields).toBe('const testOutputSchemaGen = z.object({\nname: z.string()\n})')
	})

	it('generates a schema for a SCHEMALESS table', async () => {
		const { inputFields, outputFields } = await generateSchemaForTable(
			'test',
			'DEFINE TABLE test TYPE ANY SCHEMALESS PERMISSIONS NONE',
		)

		expect(inputFields).toBe('const testInputSchemaGen = z.object({\nname: z.string()\n}).passthrough()')

		expect(outputFields).toBe('const testOutputSchemaGen = z.object({\nname: z.string()\n}).passthrough()')
	})

	it('generates a schema for a table without explicit SCHEMAFULL/SCHEMALESS setting', async () => {
		const { inputFields, outputFields } = await generateSchemaForTable(
			'test',
			'DEFINE TABLE test TYPE ANY PERMISSIONS NONE',
		)

		expect(inputFields).toBe('const testInputSchemaGen = z.object({\nname: z.string()\n}).passthrough()')

		expect(outputFields).toBe('const testOutputSchemaGen = z.object({\nname: z.string()\n}).passthrough()')
	})
})
