import { generateZodSchemaCode } from './generateZodSchemaCode.js'
import { getDetailsFromDefinition } from './getDetailsFromDefinition.js'

export const mergeNested = (fields: Record<string, string>, isInputSchema: boolean, tableName: string) => {
	const schemaName = `${tableName}${isInputSchema ? 'Input' : 'Output'}SchemaGen`

	const inputFields = Object.entries(fields)
		.map(([_fname, definition]) => {
			return getDetailsFromDefinition(definition, isInputSchema)
		})
		.filter(entry => !entry.skip)
	return generateZodSchemaCode(inputFields, schemaName)
}
