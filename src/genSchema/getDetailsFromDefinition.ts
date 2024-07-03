import { type SchemaType, handleAssertions } from './handleAssertions.js'
import { type TokenizedDefinition, tokenize } from './tokenize.js'

const typeRegex = /(?:option<)?(\w+)<?(\w+)?/i
const recordRegex = /record<(\w+)>/i

export type FieldDetail = TokenizedDefinition & { zodString: string; skip: boolean }

const getArrayType = (tokens: TokenizedDefinition): string => {
	const match = tokens.type?.match(typeRegex)

	if (match && match.length > 2) {
		const elementType = getZodTypeFromQLType(
			{
				...tokens,
				type: match[2],
			},
			false,
		)
		return `z.array(${elementType})`
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

const getSchemaForType = (type: string, tokens: TokenizedDefinition, subSchema?: string) => {
	switch (type) {
		case 'string':
			return 'z.string()'
		case 'datetime':
			return 'z.string().datetime()'
		case 'set':
			return 'z.array(z.unknown())'
		case 'array':
			return getArrayType(tokens)
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
			const type = tokens.type?.match(recordRegex)?.[1]
			if (type) {
				return `z.string().startsWith('${type}:')`
			}
			return 'z.string()'
		}
		default:
			return 'z.unknown()'
	}
}

export const getZodTypeFromQLType = (tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	const match = tokens.type?.match(typeRegex)

	if (match?.[1]) {
		const type = match[1].toLowerCase() as SchemaType
		let schema = getSchemaForType(type, tokens, subSchema)

		if (tokens.assert) {
			schema = handleAssertions(schema, tokens.assert, type)
		}
		schema = makeOptional(schema, tokens, isInputSchema)
		if (type === 'object') {
			schema = makeFlexible(schema, !!tokens.flexible)
		}
		return schema
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
