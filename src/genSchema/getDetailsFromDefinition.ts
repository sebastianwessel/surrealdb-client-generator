import { handleAssertions, type SchemaType } from './handleAssertions.js'
import { type TokenizedDefinition, tokenize } from './tokenize.js'

export type FieldDetail = TokenizedDefinition & { zodString: string; skip: boolean }

const KNOWN_TYPES = [
	'string',
	'datetime',
	'set',
	'array',
	'number',
	'float',
	'int',
	'decimal',
	'bool',
	'object',
	'record',
	'duration',
	'uuid',
	'bytes',
	'any',
	'point',
	'line',
	'polygon',
	'multipoint',
	'multiline',
	'multipolygon',
	'collection',
	'geometrycollection',
	'geometry',
] as const

const typeRegex = /(?:option<)?(\w+)(?:<([^<>]+(?:<[^<>]+>)?)>)?/i

const getArrayType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const match = tokens.type?.match(typeRegex)

	if (match?.[2]) {
		const elementType = match[2]

		if (elementType.toLowerCase() === 'record') {
			const recordMatch = elementType.match(/record(?:<(\w+)>)?/i)
			const recordType = recordMatch?.[1]
			return recordType ? `recordId('${recordType}').array()` : 'recordId().array()'
		}

		const recordTypeMatch = elementType.match(/^record<(\w+)>$/i)
		if (recordTypeMatch) {
			return `recordId('${recordTypeMatch[1]}').array()`
		}

		const innerTypeDefinition: TokenizedDefinition = {
			...tokens,
			type: elementType,
			default: undefined,
		}
		const innerType = getZodTypeFromQLType(innerTypeDefinition, isInputSchema)
		return `z.array(${innerType})`
	}
	return 'z.array(z.unknown())'
}

const getSetType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const setMatch = tokens.type?.match(/set(?:<([^,>]+)(?:,\s*(\d+))?>)?/i)

	if (setMatch?.[1]) {
		const innerTypeDefinition: TokenizedDefinition = {
			...tokens,
			type: setMatch[1],
			default: undefined,
		}
		const innerType = getZodTypeFromQLType(innerTypeDefinition, isInputSchema)
		return `z.array(${innerType})`
	}
	return 'z.array(z.unknown())'
}

const makeOptional = (schema: string, tokens: TokenizedDefinition, isInputSchema: boolean) => {
	const typeIsOptional = tokens.type?.toLowerCase().startsWith('option<') ?? false
	if (
		(!isInputSchema && typeIsOptional && !tokens.default) ||
		(isInputSchema && (tokens.default || tokens.value)) ||
		(typeIsOptional && isInputSchema)
	) {
		return `${schema}.optional()`
	}
	return schema
}

const makeFlexible = (zodString: string, isFlexible: boolean) => (isFlexible ? `${zodString}.passthrough()` : zodString)

const getSchemaForType = (type: string, tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	switch (type) {
		case 'string':
			return 'z.string()'
		case 'datetime':
			if (isInputSchema) {
				return 'z.union([z.string().datetime(), z.date()]).transform((value) => value instanceof Date ? value : new Date(value))'
			}
			return 'z.string().datetime()'
		case 'set':
			return getSetType(tokens, isInputSchema)
		case 'array':
			return getArrayType(tokens, isInputSchema)
		case 'number':
		case 'float':
		case 'int':
		case 'decimal':
			return 'z.number()'
		case 'bool':
			return 'z.boolean()'
		case 'object':
			return subSchema ?? 'z.object({})'
		case 'record': {
			const recordRegex = /record(?:<(\w+)>)?/i
			const recordMatch = tokens.type?.match(recordRegex)
			const recordType = recordMatch?.[1]
			return recordType ? `recordId('${recordType}')` : 'recordId()'
		}
		case 'duration':
			return 'z.string()'
		case 'uuid':
			return 'z.string().uuid()'
		case 'bytes':
			return 'z.instanceof(Uint8Array)'
		case 'any':
			return 'z.any()'
		case 'point':
		case 'line':
		case 'polygon':
		case 'multipoint':
		case 'multiline':
		case 'multipolygon':
		case 'collection':
		case 'geometrycollection':
		case 'geometry':
			return 'z.object({}).passthrough()'
		default:
			return 'z.unknown()'
	}
}

export const getZodTypeFromQLType = (
	tokens: TokenizedDefinition,
	isInputSchema: boolean,
	subSchema?: string,
): string => {
	let typeStringToProcess = tokens.type
	let isExplicitlyOptional = false

	if (!typeStringToProcess && tokens.flexible) {
		typeStringToProcess = 'any'
	}

	if (!typeStringToProcess) {
		let schema = 'z.any()'
		if (isInputSchema && tokens.value) {
			schema += '.optional()'
		}
		return schema
	}

	if (typeStringToProcess.toLowerCase().startsWith('option<') && typeStringToProcess.endsWith('>')) {
		isExplicitlyOptional = true
		typeStringToProcess = typeStringToProcess.substring('option<'.length, typeStringToProcess.length - 1)
	}

	if (typeStringToProcess.includes('|')) {
		const unionParts = typeStringToProcess.split('|').map(part => part.trim())

		// Check for quoted string literals (enum values)
		const allLiterals = unionParts.every(
			part => (part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'")),
		)

		if (allLiterals) {
			const enumValues = unionParts.map(part => {
				const stripped = part.slice(1, -1)
				return stripped.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
			})
			let schema = `z.enum([${enumValues.map(v => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ')}])`
			schema = makeOptional(schema, tokens, isInputSchema)
			return schema
		}

		// Check if all parts are known types (e.g., uuid | int)
		const typeKeywordRegex = /^(?:option<)?([\w]+)(?:<[^>]+>)?$/i
		const allKnownTypes = unionParts.every(part => {
			const match = part.match(typeKeywordRegex)
			return match ? KNOWN_TYPES.includes(match[1].toLowerCase() as (typeof KNOWN_TYPES)[number]) : false
		})

		// If not all known types, check for unquoted enum values (e.g., published | draft | archived)
		if (!allKnownTypes) {
			const allUnquotedIdentifiers = unionParts.every(part => /^[A-Za-z0-9_-]+$/.test(part))
			if (allUnquotedIdentifiers) {
				let schema = `z.enum([${unionParts.map(v => `'${v}'`).join(', ')}])`
				if (isExplicitlyOptional) {
					schema += '.optional()'
				}
				return schema
			}
		}

		// Handle as union of types
		const unionSchemas = unionParts.map(part => {
			const partTokens: TokenizedDefinition = { ...tokens, type: part }
			return getZodTypeFromQLType(partTokens, isInputSchema)
		})
		let schema = `z.union([${unionSchemas.join(', ')}])`
		if (isExplicitlyOptional) {
			schema += '.optional()'
		}
		return schema
	}

	if (typeStringToProcess.startsWith('range<') && typeStringToProcess.endsWith('>')) {
		const rangeContent = typeStringToProcess.slice(6, -1)
		const rangeMatch = rangeContent.match(/^(\d+)\.\.(\d+)$/)
		if (rangeMatch) {
			const [, min, max] = rangeMatch
			let schema = `z.number().min(${min}).max(${max})`
			schema = makeOptional(schema, tokens, isInputSchema)
			return schema
		}
	}

	if (typeStringToProcess) {
		const valueExtractionRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g
		const valueMatchesForValidation = Array.from(typeStringToProcess.matchAll(valueExtractionRegex))
		let isValidStructure = false

		if (valueMatchesForValidation.length > 0) {
			let reconstructedForValidation = ''
			valueMatchesForValidation.forEach((match, index) => {
				reconstructedForValidation += match[0]
				if (index < valueMatchesForValidation.length - 1) {
					reconstructedForValidation += ' | '
				}
			})
			const normalizedOriginal = typeStringToProcess.replace(/\s*\|\s*/g, ' | ')
			const normalizedReconstructed = reconstructedForValidation.replace(/\s*\|\s*/g, ' | ')
			if (normalizedOriginal === normalizedReconstructed) {
				isValidStructure = true
			}
		}

		if (isValidStructure) {
			const matches = Array.from(typeStringToProcess.matchAll(valueExtractionRegex))

			if (matches && matches.length > 0) {
				const enumValues = matches.map(match => {
					const doubleQuotedContent = match[1]
					const singleQuotedContent = match[2]
					const content = doubleQuotedContent !== undefined ? doubleQuotedContent : (singleQuotedContent ?? '')

					return content.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
				})

				let schema = `z.enum([${enumValues.map(v => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ')}])`
				schema = makeOptional(schema, tokens, isInputSchema)
				return schema
			}
		} else {
			const parts = typeStringToProcess
				.split('|')
				.map(p => p.trim())
				.filter(p => p)
			if (parts.length > 1) {
				// Check for unquoted enum values first (e.g., published | draft | archived)
				if (parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) {
					let schema = `z.enum([${parts.map(v => `'${v}'`).join(', ')}])`
					schema = makeOptional(schema, tokens, isInputSchema)
					return schema
				}

				// Check for union of known types (e.g., string | number)
				const typeKeywordRegex = /^(?:option<)?([\w]+)(?:<[^>]+>)?$/i
				const allTypes = parts.every(part => {
					const match = part.match(typeKeywordRegex)
					return match ? KNOWN_TYPES.includes(match[1].toLowerCase() as (typeof KNOWN_TYPES)[number]) : false
				})
				if (allTypes) {
					const schemas = parts.map(part => {
						const subTokens: TokenizedDefinition = { ...tokens, type: part }
						return getZodTypeFromQLType(subTokens, isInputSchema)
					})
					let schema = `z.union([${schemas.join(', ')}])`
					schema = makeOptional(schema, tokens, isInputSchema)
					return schema
				}
			}
		}
	}

	const typeRegex = /(?:option<)?([\w]+)(?:<([\w<>.'"]+)>)?/i // Adjusted to better handle nested generics
	const match = typeStringToProcess?.match(typeRegex)

	if (match?.[1]) {
		const typeKeyword = match[1].toLowerCase() as SchemaType
		const currentLevelTokens: TokenizedDefinition = { ...tokens, type: typeStringToProcess }
		let schema = getSchemaForType(typeKeyword, currentLevelTokens, isInputSchema, subSchema)

		if (tokens.assert) {
			schema = handleAssertions(schema, tokens.assert, typeKeyword)
		}

		if (typeKeyword === 'object') {
			schema = makeFlexible(schema, !!tokens.flexible)
		}

		schema = makeOptional(schema, tokens, isInputSchema)
		return schema
	}

	if (isExplicitlyOptional) {
		return 'z.unknown().optional()'
	}

	return 'z.unknown()'
}

export const shouldFieldBeSkipped = (tokens: TokenizedDefinition, isInputSchema: boolean): boolean => {
	return !!tokens.value?.trim().toLowerCase().startsWith('<future>') && isInputSchema
}

export const getDetailsFromDefinition = (definition: string, isInputSchema: boolean): FieldDetail => {
	const tokens = tokenize(definition)
	return {
		...tokens,
		zodString: getZodTypeFromQLType(tokens, isInputSchema),
		skip: shouldFieldBeSkipped(tokens, isInputSchema),
	}
}
