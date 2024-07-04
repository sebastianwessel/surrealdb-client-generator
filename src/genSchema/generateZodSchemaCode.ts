import type { FieldDetail } from './getDetailsFromDefinition.js'

export const generateZodSchemaCode = (fields: FieldDetail[], schemaName: string): string => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const buildSchema = (fieldMap: { [key: string]: any }, fields: FieldDetail[]) => {
		for (const field of fields) {
			const parts = field.name.split('.').map(part => part.replace('[*]', ''))
			let current = fieldMap

			let i = 0
			for (const part of parts) {
				if (i === parts.length - 1) {
					// Leaf node
					if (field.type?.startsWith('array')) {
						current[part] = `z.array(${field.zodString.replace('{}', '')}).default(${field.default ?? '[]'})`
					} else {
						const fieldDefault = field.default ? `.default(${field.default})` : ''
						current[part] = `${field.zodString}${fieldDefault}`
					}
				} else {
					// Intermediate node
					if (typeof current[part] === 'string') {
						current[part] = {}
					}
					if (!current[part]) {
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
		const buildObject = (obj: { [key: string]: any }): string => {
			const entries = Object.entries(obj).map(([key, value]) => {
				if (typeof value === 'string') {
					return `${key}: ${value}`
					// biome-ignore lint/style/noUselessElse: <explanation>
				} else {
					return `${key}: z.object({\n${buildObject(value)}\n})`
				}
			})
			return entries.join(',\n  ')
		}

		return `const ${schemaName} = z.object({\n  ${buildObject(fieldMap)}\n})`
	}

	const fieldMap: { [key: string]: unknown } = {}
	buildSchema(fieldMap, fields)
	return generateCode(fieldMap, schemaName)
}
