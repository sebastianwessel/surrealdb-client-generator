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

const typeRegex = /(?:option<)?(\w+)(?:<(\w+)(?:<(\w+)>)?>)?/i

const getArrayType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const match = tokens.type?.match(typeRegex)

	if (match?.[2]) {
		const elementType = match[2].toLowerCase()
		if (elementType === 'record') {
			const recordType = match[3]
			return recordType ? `recordId('${recordType}').array()` : 'recordId().array()'
		}
		const innerTypeDefinition: TokenizedDefinition = {
			...tokens,
			type: match[2],
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
		(isInputSchema && tokens.default) ||
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
			return 'z.coerce.date()'
		case 'set':
			return 'z.array(z.unknown())'
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
		// Handle FLEXIBLE fields with no explicit TYPE
		typeStringToProcess = 'any'
	}

	if (typeStringToProcess?.toLowerCase().startsWith('option<') && typeStringToProcess.endsWith('>')) {
		isExplicitlyOptional = true
		typeStringToProcess = typeStringToProcess.substring('option<'.length, typeStringToProcess.length - 1)
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

				if (parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) {
					let schema = `z.enum([${parts.map(v => `'${v}'`).join(', ')}])`
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
