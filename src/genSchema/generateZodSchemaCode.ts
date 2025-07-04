import type { FieldDetail } from './getDetailsFromDefinition.js'

const escapeRegExp = (string: string) => {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const createRegex = (key: string) => {
	const escapedKey = escapeRegExp(key)
	return new RegExp(`(?<!${escapedKey})\\[\\*\\]`, 'g')
}

export const generateZodSchemaCode = (fields: FieldDetail[], schemaName: string): string => {
	// biome-ignore lint/suspicious/noExplicitAny: ok here
	const buildSchema = (fieldMap: { [key: string]: any }, fields: FieldDetail[]) => {
		for (const field of fields) {
			const parts = field.name.split('.').map(originalPart => {
				const part = originalPart.replace('[*]', '')

				if (part.startsWith('`') && part.endsWith('`')) {
					if (part.includes('-')) {
						return part.replace(/`/g, '"')
					}
					return part.replace(/`/g, '')
				}
				return part
			})

			let current = fieldMap

			// Todo - handle default values
			const fieldDefault = undefined //field.default

			let i = 0
			for (const part of parts) {
				if (i === parts.length - 1) {
					// Leaf node
					let zodString = field.zodString
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
		// biome-ignore lint/suspicious/noExplicitAny: ok here
		const buildObject = (obj: { [key: string]: any }, parentKey = ''): string => {
			const entries = Object.entries(obj).map(([key, value]) => {
				const fullKey = parentKey ? `${parentKey}.${key}` : key
				
				// Fixed array detection logic
				const isArray = fields.some(f => {
					// Check if the original field name (before processing) contains [*] at this exact position
					const expectedArrayPattern = `${fullKey}[*]`
					return f.name === expectedArrayPattern || f.name.startsWith(`${expectedArrayPattern}.`)
				})

				if (typeof value === 'string') {
					return `${key}: ${value}${isArray ? '.array()' : ''}`
				}
				const innerObject = buildObject(value, fullKey)
				let objectSchema = `z.object({\n${innerObject}\n  })`

				const allOptional = Object.values(value).every(
					v => typeof v === 'string' && (v.includes('.optional()') || v.endsWith('.passthrough()')),
				)

				const fieldSchema = fields.find(f => f.name === fullKey)
				const isOptionalFromSchema = fieldSchema?.zodString.includes('.optional()')

				if (isArray) {
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
