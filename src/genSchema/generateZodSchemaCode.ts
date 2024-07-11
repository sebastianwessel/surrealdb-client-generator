import type { FieldDetail } from './getDetailsFromDefinition.js'

export const generateZodSchemaCode = (fields: FieldDetail[], schemaName: string): string => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const buildSchema = (fieldMap: { [key: string]: any }, fields: FieldDetail[]) => {
		for (const field of fields) {
			const parts = field.name.split('.').map(part => part.replace('[*]', ''))
			let current = fieldMap

			// Todo - handle default values
			const fieldDefault = undefined //field.default

			let i = 0
			for (const part of parts) {
				if (i === parts.length - 1) {
					// Leaf node
					let zodString = field.zodString
					if (field.type?.startsWith('array')) {
						zodString = `z.array(${zodString})`
					}
					if (fieldDefault !== undefined) {
						zodString += `.default(${fieldDefault})`
					}
					current[part] = zodString
				} else {
					// Intermediate node
					if (!current[part] || typeof current[part] === 'string') {
						current[part] = {}
					}
					current = current[part]
				}
				i++
			}
		}
	}

	const generateCode = (fieldMap: { [key: string]: unknown }, schemaName: string): string => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const buildObject = (obj: { [key: string]: any }, parentKey = ''): string => {
			const entries = Object.entries(obj).map(([key, value]) => {
				const fullKey = parentKey ? `${parentKey}.${key}` : key
				if (typeof value === 'string') {
					return `${key}: ${value}`
				}
				const innerObject = buildObject(value, fullKey)
				let objectSchema = `z.object({\n${innerObject}\n  })`

				const allOptional = Object.values(value).every(
					v => typeof v === 'string' && (v.includes('.optional()') || v.endsWith('.passthrough()')),
				)

				const fieldSchema = fields.find(f => f.name === fullKey)
				const isOptionalFromSchema = fieldSchema?.zodString.includes('.optional()')

				// Check if this object should be an array
				if (fields.some(f => f.name.includes(`${fullKey}[*]`))) {
					objectSchema += '.array()'
				}

				if (allOptional || isOptionalFromSchema) {
					objectSchema += '.optional()'
				}

				return `${key}: ${objectSchema}`
			})
			return entries.join(',\n  ')
		}

		const schema = `z.object({\n${buildObject(fieldMap)}\n})`
		return `const ${schemaName} = ${schema}`
	}

	const fieldMap: { [key: string]: unknown } = {}
	buildSchema(fieldMap, fields)
	return generateCode(fieldMap, schemaName)
}
