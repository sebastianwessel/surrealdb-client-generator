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
			if (field.name.match(/^[^.]+\[\*\]$/)) {
				continue
			}

			const parts = field.name
				.split('.')
				.map(originalPart => {
					const part = originalPart.replace('[*]', '')

					// Strip backticks if present
					if (part.startsWith('`') && part.endsWith('`')) {
						return part.replace(/`/g, '')
					}
					return part
				})
				.filter(part => part.length > 0)

			// Skip if we have no parts left after filtering (e.g., field was just "[*]")
			if (parts.length === 0) {
				continue
			}
			let current = fieldMap

			// Todo - handle default values
			const fieldDefault = undefined //field.default

			let i = 0
			for (const part of parts) {
				if (i === parts.length - 1) {
					if (current[part] && typeof current[part] === 'string') {
						i++
						continue
					}
					let zodString = field.zodString
					if (field.default !== undefined && field.default !== null && !field.zodString.includes('.optional()')) {
						const defaultValue = field.default
						if (defaultValue === 'ALWAYS' || defaultValue.startsWith('ALWAYS ')) {
							continue
						}
						const sanitizedDefault = defaultValue.replace(/^["']|["']$/g, '')
						if (
							sanitizedDefault === '[]' ||
							sanitizedDefault === '{}' ||
							sanitizedDefault === 'null' ||
							sanitizedDefault === 'true' ||
							sanitizedDefault === 'false' ||
							/^-?\d+(\.\d+)?$/.test(sanitizedDefault) ||
							sanitizedDefault.startsWith('[') ||
							sanitizedDefault.startsWith('{')
						) {
							zodString += `.default(${sanitizedDefault})`
						} else {
							zodString += `.default("${sanitizedDefault.replace(/"/g, '\\"')}")`
						}
					}
					current[part] = zodString
				} else {
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
				const regex = createRegex(key)
				const isArray = fields.some(f => {
					return f.name.replace(regex, '').includes(`${fullKey}[*]`)
				})

				const needsQuotes = /[^a-zA-Z0-9_$]/.test(key) || /^\d/.test(key)
				const quotedKey = needsQuotes ? `"${key}"` : key

				if (typeof value === 'string') {
					if (isArray && !value.includes('.array()') && !value.startsWith('z.array(')) {
						const hasOptional = value.includes('.optional()')
						const baseValue = hasOptional ? value.replace('.optional()', '') : value
						return `${quotedKey}: ${baseValue}.array()${hasOptional ? '.optional()' : ''}`
					}
					return `${quotedKey}: ${value}`
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

				return `${quotedKey}: ${objectSchema}`
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
